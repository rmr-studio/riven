#!/bin/bash

# Riven Database Migration Script
# Automatically runs SQL files in the correct order based on folder numbering
#
# Usage:
#   ./run-migrations.sh [--with-seed] [--dry-run]
#
# Options:
#   --with-seed    Include seed data after schema migration
#   --dry-run      Show which files would be executed without running them
#
# Environment Variables (required):
#   POSTGRES_HOST     Database host (default: localhost)
#   POSTGRES_PORT     Database port (default: 5432)
#   POSTGRES_DB       Database name (default: riven)
#   POSTGRES_USER     Database user (default: postgres)
#   POSTGRES_PASSWORD Database password

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-riven}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
WITH_SEED=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --with-seed)
            WITH_SEED=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--with-seed] [--dry-run]"
            echo ""
            echo "Options:"
            echo "  --with-seed    Include seed data after schema migration"
            echo "  --dry-run      Show which files would be executed without running them"
            echo ""
            echo "Environment Variables:"
            echo "  POSTGRES_HOST     Database host (default: localhost)"
            echo "  POSTGRES_PORT     Database port (default: 5432)"
            echo "  POSTGRES_DB       Database name (default: riven)"
            echo "  POSTGRES_USER     Database user (default: postgres)"
            echo "  POSTGRES_PASSWORD Database password (required)"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_DIR="${SCRIPT_DIR}/schema"
SEED_DIR="${SCRIPT_DIR}/seed"

# Check if password is set
if [ -z "$POSTGRES_PASSWORD" ] && [ "$DRY_RUN" = false ]; then
    echo -e "${RED}Error: POSTGRES_PASSWORD environment variable is not set${NC}"
    exit 1
fi

# Function to execute SQL file
execute_sql() {
    local sql_file=$1
    local relative_path="${sql_file#$SCRIPT_DIR/}"

    if [ "$DRY_RUN" = true ]; then
        echo -e "${BLUE}[DRY RUN]${NC} Would execute: ${relative_path}"
        return 0
    fi

    echo -e "${BLUE}Executing:${NC} ${relative_path}"

    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -f "$sql_file" \
        -v ON_ERROR_STOP=1 \
        --quiet

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Success: ${relative_path}"
    else
        echo -e "${RED}✗${NC} Failed: ${relative_path}"
        exit 1
    fi
}

# Function to run all SQL files in a directory
run_directory() {
    local dir=$1
    local dir_name=$(basename "$dir")

    # Check if directory exists and has SQL files
    if [ ! -d "$dir" ]; then
        return 0
    fi

    local sql_files=($(find "$dir" -maxdepth 1 -name "*.sql" -type f | sort))

    if [ ${#sql_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}Skipping empty directory: ${dir_name}${NC}"
        return 0
    fi

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Processing: ${dir_name}${NC}"
    echo -e "${GREEN}========================================${NC}"

    for sql_file in "${sql_files[@]}"; do
        execute_sql "$sql_file"
    done
}

# Print configuration
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Riven Database Migration${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Host:     ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo -e "Database: ${POSTGRES_DB}"
echo -e "User:     ${POSTGRES_USER}"
echo -e "Seed:     ${WITH_SEED}"
echo -e "Dry Run:  ${DRY_RUN}"
echo -e "${GREEN}========================================${NC}"

if [ "$DRY_RUN" = false ]; then
    # Test database connection
    echo -e "${BLUE}Testing database connection...${NC}"
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -c "SELECT version();" \
        --quiet > /dev/null 2>&1

    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to connect to database${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Database connection successful"
fi

# Run schema migrations in order
# The folders are numbered to ensure correct execution order:
# 00 - Extensions (PostgreSQL extensions)
# 01 - Tables (base table definitions)
# 02 - Indexes (performance indexes)
# 03 - Functions (stored procedures)
# 04 - Constraints (foreign keys, checks)
# 05 - RLS (row-level security policies)
# 06 - Types (custom types)
# 07 - Views (database views)
# 08 - Triggers (database triggers)
# 09 - Grants (permissions)

SCHEMA_FOLDERS=(
    "00_extensions"
    "01_tables"
    "02_indexes"
    "03_functions"
    "04_constraints"
    "05_rls"
    "06_types"
    "07_views"
    "08_triggers"
    "09_grants"
)

for folder in "${SCHEMA_FOLDERS[@]}"; do
    run_directory "${SCHEMA_DIR}/${folder}"
done

# Run seed data if requested
if [ "$WITH_SEED" = true ]; then
    if [ -d "$SEED_DIR" ]; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}Processing: seed data${NC}"
        echo -e "${GREEN}========================================${NC}"

        # Run seed files in alphabetical order
        seed_files=($(find "$SEED_DIR" -maxdepth 1 -name "*.sql" -type f | sort))

        for sql_file in "${seed_files[@]}"; do
            execute_sql "$sql_file"
        done
    else
        echo -e "${YELLOW}Warning: Seed directory not found at ${SEED_DIR}${NC}"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Migration completed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
