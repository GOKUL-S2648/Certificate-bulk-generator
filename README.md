# 🎓 CertifyBulk — Bulk Certificate Generator

An intelligent full-stack web application that simplifies bulk certificate generation, recipient management, certificate verification, and batch processing through a modern dashboard.

This system combines React, TypeScript, Node.js, Express, and Supabase to deliver a scalable and user-friendly certificate management platform.

## 🚀 Live Demo

🔗 https://certificate-bulk-generator-frontend.onrender.com

> Click the link above to access the deployed application.

## 📌 Problem Statement

Traditional certificate generation requires repetitive manual work, especially when handling large numbers of recipients.

Organizations and educational institutions face challenges in generating certificates, validating recipient information, tracking batch progress, and verifying certificate authenticity efficiently.

CertifyBulk addresses these challenges by providing an automated certificate generation and management platform.

## 🎯 Objectives

- Automate certificate generation for multiple recipients.
- Provide an interactive dashboard for certificate management.
- Validate recipient information before processing.
- Track certificate-generation jobs and processing results.
- Generate downloadable certificates in PDF format.
- Enable certificate verification using unique identifiers and verification hashes.
- Build a secure and scalable full-stack application.

## ✨ Key Features

✅ Bulk certificate generation  
✅ Interactive dashboard for managing certificate batches  
✅ Recipient validation and error tracking  
✅ Unique certificate ID generation  
✅ PDF and SVG certificate rendering  
✅ Certificate preview and download  
✅ Batch result downloads using ZIP archives  
✅ Certificate verification functionality  
✅ Supabase authentication and database integration  
✅ Responsive user interface  
✅ Cloud deployment using Render  

## 🧠 System Architecture

User  
→ React Frontend  
→ Supabase Authentication  
→ Node.js / Express Backend  
→ Certificate Generation Engine  
→ Supabase Database  
→ PDF / SVG / ZIP Downloads  

### Benefits

- Automated certificate processing
- Modular full-stack architecture
- Secure authentication and access control
- Efficient batch management
- Easy maintenance and scalability

## 🗄️ Database Schema

### Entities

- User
- Jobs
- Certificates
- Job Failures

### Relationships

- One User → Many Certificate Generation Jobs
- One Job → Many Certificates
- One Job → Many Job Failure Records

This design supports certificate batch tracking, recipient processing, and error management.

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript

### Authentication & Database
- Supabase Auth
- Supabase Database

### Certificate Generation
- PDF-lib
- SVG Rendering
- JSZip

### Email Integration
- Resend API
- Nodemailer

### Deployment
- Render

### Version Control
- Git
- GitHub

## 📂 Project Structure

```text
Certificate-bulk-generator/
│
├── public/
├── src/
│   ├── components/
│   ├── lib/
│   │   ├── api.ts
│   │   └── supabase.ts
│   ├── server/
│   │   ├── routes.ts
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── renderer.ts
│   │   ├── validator.ts
│   │   └── tests.ts
│   ├── App.tsx
│   └── main.tsx
│
├── python_backend/
├── scripts/
├── server.ts
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/GOKUL-S2648/Certificate-bulk-generator.git
cd Certificate-bulk-generator
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
```

Configure only the environment variables required by the features enabled in your project. Keep private API keys and credentials out of GitHub.

### 4️⃣ Run locally

Start the application in development mode:

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

### 5️⃣ Build for production

```bash
npm run build
```

### 6️⃣ Start the production server

```bash
npm start
```

Set `NODE_ENV=production` when running the production server locally so the Express server serves the built frontend.

## ☁️ Deployment

### Frontend Deployment

1. Push the latest code to GitHub.
2. Connect the repository to Render as a Static Site.
3. Configure the build command:

```bash
npm install && npm run build
```

4. Set the publish directory to:

```text
dist
```

5. Add the required frontend environment variables.
6. Deploy and test the live application.

### Backend Deployment

1. Create a Render Web Service.
2. Connect the same GitHub repository.
3. Configure the build command:

```bash
npm install
```

4. Configure the start command:

```bash
npm start
```

5. Add the required backend environment variables.
6. Verify the backend health endpoint:

```text
https://YOUR-BACKEND-URL.onrender.com/api/health
```

## 🔐 Security Considerations

- Keep backend secrets and API keys private.
- Never commit real `.env` files to GitHub.
- Validate recipient data before certificate generation.
- Protect API endpoints with authentication.
- Verify job ownership before allowing access to certificate records.
- Configure appropriate Supabase database permissions.
- Use HTTPS for production deployments.

## 🧪 Testing

The application supports certificate-related test functionality through its backend API.

Recommended test scenarios:

- Create a certificate-generation job.
- Process valid recipient records.
- Validate invalid recipient information.
- Verify generated certificate identifiers.
- Preview and download generated certificates.
- Test authenticated API access.
- Verify batch processing results and failure records.

## 🚀 Future Enhancements

- Excel and CSV recipient imports
- Custom certificate templates
- QR-code-based certificate verification
- Email delivery status tracking
- Advanced batch analytics
- Automated email notifications
- Role-based access control
- Improved certificate search and filtering

## 👨‍💻 Author

**GOKUL S**

GitHub: [@GOKUL-S2648](https://github.com/GOKUL-S2648/Certificate-bulk-generator)

---

**CertifyBulk — Making bulk certificate generation simple, secure, and efficient.**
