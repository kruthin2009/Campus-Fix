# Reopen Requests tab update

- Added `/admin/reopen-requests` to the administrative portal navigation and route table.
- The page loads complaints, finds pending `reopenRequests` subcollection entries, and displays student, complaint, room, tower, department, priority, reason, and request time.
- Administrators can open the complaint, accept and reopen it, or decline the request.
- Fixed request mapping to use the Firestore document ID rather than the placeholder `id` stored in the request payload. This is required for approve/decline actions to target the correct document.
- Approval returns the complaint to `submitted`, adds a timeline entry, and sends the student a notification through the existing report service.
- Declining records the decision and notifies the student.

Checks: release structure and internal route checks pass. Production build was attempted but could not complete because required local TypeScript/Vite type packages were unavailable and `npm ci` timed out in this environment. Live Firebase permissions and end-to-end review actions still require testing in the deployed project.
