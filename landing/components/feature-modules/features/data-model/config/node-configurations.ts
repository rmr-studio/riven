import {
  AtSign,
  BarChart,
  Briefcase,
  Building,
  Calendar,
  CheckSquare,
  Circle,
  Clipboard,
  Clock,
  Code,
  CreditCard,
  Database,
  DollarSign,
  FileText,
  Flag,
  Folder,
  Globe,
  Hash,
  Heart,
  Layers,
  Link,
  MessageCircle,
  Package,
  Receipt,
  Scroll,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Text,
  Truck,
  User,
  Users,
  Zap,
} from 'lucide-react';
import type { NodeConfigurations } from '../types';
import { createPrimaryNode, createSecondaryNode } from '../utils/node-helpers';

export const nodeConfigurations: NodeConfigurations = {
  // SaaS: Wide tree pattern — Company anchored left, branching right
  saas: [
    {
      ...createPrimaryNode(
        'company',
        'Company',
        Building,
        [
          { title: 'Company name', icon: Text },
          { title: 'MRR', icon: DollarSign },
          { title: 'Plan tier', icon: Layers },
        ],
        8,
        { x: -60, y: 180 },
      ),
      mobile: {
        position: { x: 0, y: 0 },
        dimensions: { width: 220, height: 160 },
      },
    },
    {
      ...createPrimaryNode(
        'subscription',
        'Subscription',
        CreditCard,
        [
          { title: 'Plan', icon: Tag },
          { title: 'Status', icon: Circle },
          { title: 'Renewal date', icon: Calendar },
        ],
        5,
        { x: 340, y: 80 },
      ),
      mobile: {
        position: { x: 300, y: 360 },
        dimensions: { width: 220, height: 160 },
      },
    },
    {
      ...createPrimaryNode(
        'user',
        'User',
        User,
        [
          { title: 'Email', icon: AtSign },
          { title: 'Role', icon: Shield },
          { title: 'Last active', icon: Clock },
        ],
        6,
        { x: 760, y: 80 },
      ),
      mobile: {
        position: { x: 0, y: 600 },
        dimensions: { width: 220, height: 160 },
      },
    },
    createPrimaryNode(
      'feature-usage',
      'Feature Usage',
      BarChart,
      [
        { title: 'Feature name', icon: Text },
        { title: 'Usage count', icon: Hash },
        { title: 'Last used', icon: Clock },
      ],
      3,
      { x: 380, y: 370 },
    ),
    createPrimaryNode(
      'team',
      'Team',
      Users,
      [
        { title: 'Name', icon: Text },
        { title: 'Members', icon: Hash },
        { title: 'Plan seats', icon: Layers },
      ],
      4,
      { x: 760, y: 370 },
    ),
    // Faded ecosystem nodes — spread around the periphery
    createSecondaryNode('activity-log', 'Activity Log', Scroll, { x: -140, y: 60 }),
    createSecondaryNode('api-keys', 'API Keys', Code, { x: 120, y: 460 }),
    {
      ...createSecondaryNode('integrations', 'Integrations', Zap, { x: 330, y: -30 }),
      mobile: {
        position: { x: 120, y: 280 },
        dimensions: { width: 110, height: 36 },
      },
    },
    createSecondaryNode('webhooks', 'Webhooks', Link, { x: 660, y: -30 }),
    {
      ...createSecondaryNode('invoices', 'Invoices', Receipt, { x: 1000, y: 0 }),
      mobile: {
        position: { x: 380, y: 120 },
        dimensions: { width: 110, height: 36 },
      },
    },
    {
      ...createSecondaryNode('payments', 'Payments', DollarSign, { x: 650, y: 300 }),
      mobile: {
        position: { x: 380, y: 640 },
        dimensions: { width: 110, height: 36 },
      },
    },

    createSecondaryNode('support-tickets', 'Support', MessageCircle, { x: 1000, y: 300 }),
    createSecondaryNode('feedback', 'Feedback', Heart, { x: 860, y: -80 }),
  ],

  // Agency: Horizontal pipeline — evenly spaced left to right
  agency: [
    {
      ...createPrimaryNode(
        'client',
        'Client',
        Building,
        [
          { title: 'Company', icon: Text },
          { title: 'Industry', icon: Tag },
          { title: 'Retainer', icon: DollarSign },
        ],
        7,
        { x: 120, y: 180 },
      ),
      mobile: {
        position: { x: 300, y: 0 },
        dimensions: { width: 220, height: 160 },
      },
    },
    {
      ...createPrimaryNode(
        'project',
        'Project',
        Briefcase,
        [
          { title: 'Name', icon: Text },
          { title: 'Budget', icon: DollarSign },
          { title: 'Deadline', icon: Calendar },
        ],
        9,
        { x: 200, y: 500 },
      ),
      mobile: {
        position: { x: 240, y: 600 },
        dimensions: { width: 220, height: 160 },
      },
    },
    {
      ...createPrimaryNode(
        'task',
        'Task',
        CheckSquare,
        [
          { title: 'Title', icon: Text },
          { title: 'Assignee', icon: User },
          { title: 'Due date', icon: Calendar },
        ],
        6,
        { x: 700, y: 180 },
      ),
      mobile: {
        position: { x: 0, y: 300 },
        dimensions: { width: 220, height: 160 },
      },
    },
    createPrimaryNode(
      'deliverable',
      'Deliverable',
      Package,
      [
        { title: 'Type', icon: Tag },
        { title: 'Status', icon: Circle },
        { title: 'Version', icon: Hash },
      ],
      4,
      { x: 1050, y: 600 },
    ),
    // Faded nodes — flanking the pipeline
    createSecondaryNode('proposals', 'Proposals', Clipboard, { x: -100, y: 60 }),
    {
      ...createSecondaryNode('contracts', 'Contracts', FileText, { x: -100, y: 310 }),
      mobile: {
        position: { x: 440, y: 300 },
        dimensions: { width: 110, height: 36 },
      },
    },
    {
      ...createSecondaryNode('time-entries', 'Timesheets', Clock, { x: 200, y: 50 }),
      mobile: {
        position: { x: 0, y: 60 },
        dimensions: { width: 110, height: 36 },
      },
    },
    createSecondaryNode('briefs', 'Briefs', Scroll, { x: 0, y: 560 }),
    createSecondaryNode('feedback', 'Feedback', MessageCircle, { x: 550, y: 50 }),
    createSecondaryNode('milestones', 'Milestones', Flag, { x: 650, y: 500 }),
    createSecondaryNode('assets', 'Assets', Folder, { x: 900, y: 50 }),
    createSecondaryNode('reviews', 'Reviews', Star, { x: 900, y: 500 }),
    createSecondaryNode('invoices', 'Invoices', Receipt, { x: 1280, y: 60 }),
    createSecondaryNode('notes', 'Notes', Text, { x: 1280, y: 310 }),
    createSecondaryNode('team-member', 'Team', Users, { x: 1120, y: 180 }),
  ],

  // E-commerce: Hub pattern — Customer in center, others at corners
  ecommerce: [
    {
      ...createPrimaryNode(
        'customer',
        'Customer',
        User,
        [
          { title: 'Name', icon: Text },
          { title: 'Email', icon: AtSign },
          { title: 'Lifetime value', icon: DollarSign },
        ],
        8,
        { x: 420, y: 200 },
      ),
      mobile: {
        position: { x: 0, y: 0 },
        dimensions: { width: 220, height: 160 },
      },
    },
    {
      ...createPrimaryNode(
        'order',
        'Order',
        ShoppingCart,
        [
          { title: 'Order #', icon: Hash },
          { title: 'Total', icon: DollarSign },
          { title: 'Status', icon: Circle },
        ],
        6,
        { x: 60, y: 50 },
      ),
      mobile: {
        position: { x: 240, y: 600 },
        dimensions: { width: 220, height: 160 },
      },
    },
    {
      ...createPrimaryNode(
        'product',
        'Product',
        Package,
        [
          { title: 'SKU', icon: Hash },
          { title: 'Name', icon: Text },
          { title: 'Price', icon: DollarSign },
        ],
        12,
        { x: 780, y: 50 },
      ),
      mobile: {
        position: { x: 0, y: 300 },
        dimensions: { width: 220, height: 160 },
      },
    },
    createPrimaryNode(
      'shipment',
      'Shipment',
      Truck,
      [
        { title: 'Tracking #', icon: Hash },
        { title: 'Carrier', icon: Text },
        { title: 'ETA', icon: Calendar },
      ],
      4,
      { x: 60, y: 370 },
    ),
    createPrimaryNode(
      'subscription',
      'Subscription',
      CreditCard,
      [
        { title: 'Plan', icon: Tag },
        { title: 'Next billing', icon: Calendar },
        { title: 'Status', icon: Circle },
      ],
      5,
      { x: 780, y: 370 },
    ),
    // Faded nodes — radial around center
    {
      ...createSecondaryNode('reviews', 'Reviews', Star, { x: 420, y: -30 }),
      mobile: {
        position: { x: 400, y: 180 },
        dimensions: { width: 110, height: 36 },
      },
    },
    createSecondaryNode('wishlists', 'Wishlists', Heart, { x: 200, y: -30 }),
    {
      ...createSecondaryNode('carts', 'Carts', ShoppingCart, { x: 640, y: -30 }),
      mobile: {
        position: { x: 480, y: 400 },
        dimensions: { width: 110, height: 36 },
      },
    },
    createSecondaryNode('categories', 'Categories', Folder, { x: -100, y: 140 }),
    createSecondaryNode('promotions', 'Promotions', Tag, { x: -100, y: 280 }),
    createSecondaryNode('returns', 'Returns', Package, { x: -100, y: 430 }),
    createSecondaryNode('inventory', 'Inventory', Database, { x: 900, y: -60 }),
    createSecondaryNode('suppliers', 'Suppliers', Building, { x: 1020, y: 280 }),
    createSecondaryNode('warehouses', 'Warehouses', Building, { x: 1020, y: 700 }),
    createSecondaryNode('addresses', 'Addresses', Globe, { x: 420, y: 470 }),
  ],
};
