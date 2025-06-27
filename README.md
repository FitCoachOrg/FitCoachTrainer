# TrainerFitCoach

A comprehensive fitness coaching platform for trainers to manage their clients, track progress, and provide personalized coaching.

## Client Invitation Workflow

### Overview

The client invitation system allows trainers to invite clients to the platform via email. The workflow is as follows:

1. Trainer enters client's email (and optionally name and custom message) in the "Add Client" form
2. System creates a relationship record in the `trainer_client_web` table with status "pending"
3. System sends an invitation email to the client via Mailgun
4. Client receives email with a signup link containing trainer ID and email parameters
5. Client creates an account using the link
6. On successful signup, the system:
   - Creates a client record in the `client` table
   - Updates the relationship in `trainer_client_web` with the client ID and status "active"

### Database Schema

#### trainer_client_web Table

```sql
create table public.trainer_client_web (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  trainer_id uuid null default gen_random_uuid(),
  client_id bigint null,
  status text null default 'pending'::text,
  trainer_notes text null,
  cl_email text not null,
  trainer_name text null,
  constraint trainer_client_web_pkey primary key (id),
  constraint trainer_client_web_trainer_id_fkey foreign KEY (trainer_id) references trainer (id)
) TABLESPACE pg_default;
```

### Components

#### 1. Client Form (`ClientForm.tsx`)

- Allows trainers to invite new clients
- Collects client email, name (optional), and custom message (optional)
- Fetches trainer information from the current session
- Calls the Supabase Edge Function to send invitation

#### 2. Supabase Edge Function (`send_client_invitation/index.ts`)

- Validates request data
- Creates or updates relationship in `trainer_client_web` table
- Sends invitation email via Mailgun API
- Returns success/error response

#### 3. Signup Page (`Signup.tsx`)

- Handles client registration from invitation links
- Parses trainer ID and email from URL parameters
- Verifies if invitation exists in the database
- Creates client account and updates relationship status

### Environment Variables

The following environment variables are required for the Edge Function:

```
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_FROM_EMAIL=noreply@yourapp.com
FRONTEND_URL=https://yourapp.com
```

### Testing Locally

To test the Edge Function locally:

1. Start Supabase: `supabase start`
2. Make a request:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send_client_invitation' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "clientEmail": "client@example.com",
    "clientName": "John Doe",
    "trainerName": "Jane Smith",
    "trainerId": "uuid-of-trainer",
    "customMessage": "I think you would benefit from our program!"
  }'
```

## Development

### Prerequisites

- Node.js
- npm or yarn
- Supabase account

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`