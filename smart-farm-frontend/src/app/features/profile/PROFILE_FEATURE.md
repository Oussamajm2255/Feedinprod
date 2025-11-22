# Profile Feature

## Purpose
The Profile feature lets authenticated users view and update their personal information and change their password. It also surfaces read-only account metadata (role, status, created_at, last_login).

## High-level Architecture
- **Component**: `ProfileComponent` (standalone Angular component)
  - File: `profile.component.ts` / `profile.component.html` / `profile.component.scss`
- **Dependencies**:
  - `AuthService`: provides the current user signal `user()` and setter `user.set(...)`.
  - `ApiService`: exposes `updateUser(userId, payload)` and `updatePassword(userId, newPassword)` to persist changes server-side.
  - Angular Reactive Forms: `FormBuilder`, `FormGroup`, built-in `Validators`.
  - Angular Material UI: `MatTabs`, `MatCard`, `MatFormField`, `MatInput`, `MatButton`, `MatIcon`, `MatProgressSpinner`, `MatSnackBar`.

## UI Structure
- `mat-tab-group` with 3 tabs:
  1) **Profile Information**: editable form for personal details
  2) **Change Password**: controlled password update form with visibility toggles
  3) **Account Information**: read-only account metadata pulled from the current `user()`

## Data Model
- Backed by `User` interface (see `core/models/user.model`). Fields used:
  - `user_id`, `first_name`, `last_name`, `email`, `phone?`, `address?`, `city?`, `country?`, `date_of_birth?`, `gender?`, `role`, `status`, `created_at`, `last_login?`.

## Reactive Forms
- `profileForm`
  - Controls: `first_name (required, minLength 2)`, `last_name (required, minLength 2)`, `email (required, email)`, `phone`, `address`, `city`, `country`, `date_of_birth`, `gender`.
  - Initialization: `ngOnInit` calls `loadUserProfile()` to `patchValue` from `authService.user()` for pre-fill.
  - Submission: `onProfileSubmit()`
    - Validates form; if valid, sets `isLoading` and calls `apiService.updateUser(user_id, profileForm.value)`.
    - On success: snackbar feedback, `authService.user.set(updatedUser)` to sync global user state.
    - On error: snackbar error and console log.

- `passwordForm`
  - Controls: `currentPassword (required)`, `newPassword (required, minLength 6)`, `confirmPassword (required)`.
  - Custom validator: `passwordMatchValidator` sets `passwordMismatch` when values differ.
  - Submission: `onPasswordSubmit()`
    - Validates form; if valid, sets `isPasswordLoading` and calls `apiService.updatePassword(user_id, newPassword)`.
    - On success: snackbar feedback and `passwordForm.reset()`.
    - On error: snackbar error and console log.

## Validation & Errors
- Built-in validators for required, email, and minLength.
- Custom group validator for password confirmation.
- `getErrorMessage(formGroup, fieldName)` centralizes user-friendly messages, read by `mat-error` in the template.
- `markFormGroupTouched(formGroup)` marks controls touched to reveal errors on submit.

## UX & Accessibility
- Button-level loading indicators with inline `mat-spinner` and disabled states during submit.
- Password visibility toggles for all password inputs with `aria-label`/`aria-pressed` bindings.
- Responsive layout: two-column rows collapse to single column at ≤768px.
- Readable typography and card-based grouping.

## State & Data Flow
1) On init, component retrieves the current user from `AuthService.user()` signal.
2) `profileForm` is populated from that user.
3) On profile save, updated values are sent via `ApiService.updateUser`.
4) On success, the returned `updatedUser` replaces the global user via `AuthService.user.set(updatedUser)`, ensuring consistency across the app.
5) On password change, only the password is sent with `ApiService.updatePassword`; no user fields mutate locally.

## Error Handling
- Errors during API calls clear loading flags and show a snackbar. Errors are also logged to the console.
- There is no field-level server error mapping yet (e.g., duplicate email). See Enhancements.

## Security Considerations
- Password form requires current and new password; however, only `newPassword` is currently sent to the API. Ensure backend verifies current password.
- Inputs rely on client-side validators; backend must validate and sanitize all fields.
- Avoid pre-filling sensitive fields beyond what’s necessary.

## Styling
- Encapsulated SCSS provides spacing, layout grid (rows/half-width), and mobile breakpoints.
- Button spinner positioned absolutely for balanced inline feedback.

## Integration Points
- `AuthService`
  - `user()` returns the current user (likely an Angular signal).
  - `user.set(updatedUser)` updates the global state post-update.
- `ApiService`
  - `updateUser(userId, payload)` → Observable<User>
  - `updatePassword(userId, newPassword)` → Observable<void|unknown>

## Known Constraints / Assumptions
- `ApiService.updatePassword` expects only new password; current password validation is assumed on the server or missing.
- Profile fields are updated atomically; there’s no optimistic UI apart from `isLoading`/`isPasswordLoading` flags.
- No granular success feedback per field; success is for the whole form.

## Testing Notes
- Unit-test `passwordMatchValidator` and `getErrorMessage`.
- Mock `AuthService` and `ApiService` to verify: form initialization, submit success, submit error, and state flags.
- Template tests: show/hide errors on touch; disabled state with loading; password visibility toggles.

## Enhancement Backlog (Prioritized)
1) Validation & Security
   - Send `currentPassword` along with `newPassword` to the backend for verification.
   - Stronger password policy (e.g., length, character diversity, breach checks).
   - Server error mapping to specific fields (e.g., email taken).
2) UX Improvements
   - Dirty-state detection and disable Save until changes exist.
   - Inline success state per field and top-level form-summary messages.
   - Add `MatDatepicker` for `date_of_birth` instead of native `type=date` for consistency.
3) Data Completeness
   - Add profile avatar upload and preview.
   - Add locale/timezone preferences.
   - Add two-factor authentication management.
4) Resilience
   - Retry strategy and user-facing guidance on transient failures.
   - Disable email field if managed externally or requires re-verification flow.
5) Accessibility
   - Audit tab order, ARIA roles, and contrast.
   - Add descriptive `aria-describedby` links from errors to inputs.
6) Performance
   - Avoid unnecessary `patchValue` on every change detection; only on init or user change.
   - Consider `OnPush` change detection if compatible with signals usage.

## Implementation Tips for Enhancements
- Add `currentPassword` to API payload and update backend contract; surface error message if mismatch.
- Introduce a `hasFormChanged` computed signal to enable Save only when dirty and valid.
- Extract shared form helper functions to a utility for reuse across features.
- Wrap success/error snackbars into a `NotificationService` for consistency.

## Appendix: Template Landmarks
- Profile form: `form[formGroup="profileForm"]` with `mat-error` bound to `getErrorMessage`.
- Password form: `form[formGroup="passwordForm"]` with visibility toggles and `passwordMatchValidator`.
- Account info: bindings to `user()?.{user_id, role, status, created_at, last_login}`.
