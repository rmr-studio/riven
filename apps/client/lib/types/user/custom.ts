// user/custom.ts
// Custom types for user domain (inlined from OpenAPI operations)

import type { User } from "./models";

// ----- Request Payloads -----

// updateUserProfile uses User type directly as request body
export type UpdateUserProfileRequest = User;

// ----- Response Payloads -----

// All user operations return User type
export type GetCurrentUserResponse = User;
export type GetUserByIdResponse = User;
export type UpdateUserProfileResponse = User;

// ----- Path Parameter Types (inlined from OpenAPI operations) -----

export interface GetUserByIdPathParams {
    userId: string;
}

export interface DeleteUserProfileByIdPathParams {
    userId: string;
}
