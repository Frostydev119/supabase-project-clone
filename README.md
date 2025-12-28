# Supabase Project Cloner

Clone your Supabase projects with ease! This tool generates SQL migration files to replicate your database schema, RLS policies, and storage configurations from one Supabase project to another.

## ✨ Features

- 📊 **Schema Migration** - Clone tables, columns, data types, and constraints
- 🔒 **RLS Policies** - Migrate Row Level Security policies
- 📦 **Storage Buckets** - Clone storage bucket configurations
- 💾 **Data Export** - Export table data as INSERT statements
- 🎯 **Flexible Options** - Choose schema-only, data-only, or both
- 🌐 **Deploy Anywhere** - Run locally or deploy to Netlify
- 🎨 **Modern UI** - Beautiful interface built with React and TailwindCSS

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** installed on your machine
- **Supabase Access Token** - [Get one here](https://supabase.com/dashboard/account/tokens)
- **Service Role Keys** for your source and target projects

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/supabase-project-clone.git
   cd supabase-project-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Choose your setup:**

   **Option A: Run Locally (Simple)**
   ```bash
   npm run dev:vite
   ```
   Then open `http://localhost:5173` in your browser.

   **Option B: Run with Netlify Dev (Recommended for testing deployment)**
   ```bash
   npm run dev
   ```
   This runs the app with Netlify Functions locally on `http://localhost:8888`.

## 📖 How to Use

Once the app is running, the interface will guide you through the migration process step-by-step:

1. **Enter your Supabase Access Token** - Get one from [your account settings](https://supabase.com/dashboard/account/tokens)
2. **Select source and target projects** - Enter Service Role Keys for both
3. **Choose migration options** - Schema, data, or both
4. **Generate migration file** - Download the SQL file
5. **Run in target project** - Execute the SQL in your target project's SQL Editor

> **Optional:** Run the SQL from `SETUP_RLS_HELPER.sql` in your source project to enable automatic RLS policy migration.

## 🎯 What Gets Migrated

### ✅ Included
- **Database Schema**
  - Tables and columns with correct data types (including UUID, timestamps, etc.)
  - Primary keys and constraints
  - Default values
- **RLS Policies**
  - SELECT, UPDATE, DELETE policies (automatic)
  - INSERT policies (require manual creation - instructions provided)
- **Storage Buckets**
  - Bucket configurations
  - Public/private settings
- **Table Data** (optional)
  - Exported as INSERT statements

### ❌ Not Included
- Files in storage buckets (only bucket configs)
- PostgreSQL functions and triggers
- Edge Functions
- Authentication users and settings
- Realtime subscriptions
- Database extensions

## ⚠️ Important Notes

### INSERT Policies Require Manual Creation
Due to PostgreSQL limitations, INSERT-only policies cannot be automatically migrated. The generated SQL file includes:
- A prominent "MANUAL ACTION REQUIRED" section
- Step-by-step instructions for each INSERT policy
- Direct links to your target project's policy editor

### Security & Privacy
- ✅ All operations happen in your browser
- ✅ Tokens and keys are never stored
- ✅ No backend server - direct API calls to Supabase
- ✅ Open source - audit the code yourself

### Best Practices
- Use a **fresh target project** to avoid conflicts
- **Review the SQL file** before running it
- **Test on a development project** first
- Set access tokens to **expire in 1 hour** for security

### Run Locally Without Netlify

If you prefer not to use Netlify:

```bash
npm run dev:vite
```

This runs just the Vite dev server. The app will work, but you'll need to handle CORS if making direct API calls.

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **API:** Supabase Management API
- **Deployment:** Netlify (optional)
- **Functions:** Netlify Functions (for production CORS handling)

## 📝 Known Limitations

- **INSERT Policies:** Require manual creation (instructions provided in SQL file)
- **Complex Types:** Some advanced PostgreSQL types may need manual adjustment
- **Functions/Triggers:** Not migrated - must be recreated manually
- **Large Datasets:** Very large tables may take time to export

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/supabase-project-clone.git

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests (if available)
npm test

# Build for production
npm run build
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**
