# Admin User Setup Guide

This guide explains how to create an admin user account to access the Admin Panel.

## Method 1: Using the Create Admin Script (Recommended)

The easiest way to create an admin user is using the provided script.

### Steps:

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the create admin script:**
   ```bash
   npm run create-admin <email> <password> [firstName] [lastName]
   ```

   **Example:**
   ```bash
   npm run create-admin admin@example.com Admin@123 Admin User
   ```

   Or directly with node:
   ```bash
   node scripts/createAdmin.js admin@example.com Admin@123 Admin User
   ```

3. **The script will:**
   - Connect to your MongoDB database
   - Create a new admin user (or update existing user to admin)
   - Set the role to 'admin'
   - Mark email as verified
   - Activate the account

4. **Login with your admin credentials:**
   - Go to the login page
   - Enter your email and password
   - You'll now see the "Admin" link in the sidebar
   - Click it to access the Admin Dashboard

### Password Requirements:
- At least 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain a number
- Must contain a special character (@$!%*?&)

**Example valid passwords:**
- `Admin@123`
- `MyPass123!`
- `Secure@2024`

---

## Method 2: Using MongoDB Directly

If you prefer to create an admin user directly in MongoDB:

### Steps:

1. **Connect to your MongoDB database** (using MongoDB Compass, mongo shell, or any MongoDB client)

2. **Find your user collection** (usually named `users`)

3. **Update an existing user to admin:**
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

4. **Or create a new admin user** (password will need to be hashed):
   ```javascript
   // Note: You'll need to hash the password first using bcrypt
   // It's easier to use the script method above
   ```

---

## Method 3: Using the Admin API (If you already have an admin)

If you already have an admin user, you can promote other users to admin using the Admin Panel:

1. **Login as existing admin**
2. **Go to Admin Dashboard** → **Users tab**
3. **Find the user** you want to promote
4. **Click the Edit (pencil) icon** next to the user
5. **Change their role** to "admin"

---

## Verifying Admin Access

After creating an admin user:

1. **Login** with your admin credentials
2. **Check the sidebar** - you should see an "Admin" link with a shield icon
3. **Click the Admin link** - you should see the Admin Dashboard with:
   - System Statistics
   - User Management
   - Activity Logs

---

## Troubleshooting

### "User already exists" error
- The script will update the existing user to admin role
- If the user is already an admin, it will just confirm

### "MONGODB_URI not found" error
- Make sure your `.env` file in the `backend` directory has `MONGODB_URI` set
- Check that the MongoDB connection string is correct

### Can't see Admin link after login
- Make sure the user's role is set to 'admin' in the database
- Try logging out and logging back in
- Check browser console for any errors

### Password validation error
- Ensure your password meets all requirements:
  - Minimum 8 characters
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
  - Contains special character (@$!%*?&)

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change default admin password** immediately after first login
2. **Use strong passwords** for admin accounts
3. **Limit admin access** to trusted users only
4. **Regularly audit** admin users in the Admin Panel
5. **Don't share admin credentials** - create separate admin accounts for each administrator

---

## Quick Reference

```bash
# Create admin user
npm run create-admin admin@example.com Admin@123 Admin User

# Or with node directly
node scripts/createAdmin.js admin@example.com Admin@123 Admin User
```

**Admin Panel URL:** `/admin` (after login)

**Required Role:** `admin`

**Available Roles:**
- `user` - Regular user (default)
- `recruiter` - Recruiter role
- `admin` - Administrator role

