Here are all the commands to run Nagar Drishti from scratch in your Windows PowerShell terminals:

Terminal 1: Start the Backend (FastAPI + Live Supabase Database)
Open a PowerShell terminal and run:

powershell
cd "d:\My Coding Project\Nagar Dristhi\backend"
..\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
📡 Backend API: http://127.0.0.1:8000
📑 Interactive Swagger Docs: http://127.0.0.1:8000/docs
🗄️ Database: Connected directly to your Supabase PostgreSQL cluster in Mumbai.

Terminal 2: Start the Frontend (Vite React UI)
Open a second PowerShell terminal and run:

powershell
cd "d:\My Coding Project\Nagar Dristhi\frontend"
npm run dev
🌐 Public Portal: http://127.0.0.1:5173/
🔐 Officer Login: http://127.0.0.1:5173/auth
🗺️ Command Center: http://127.0.0.1:5173/command
🚌 Live Buses (All-India & States): http://127.0.0.1:5173/buses

🔑 Officer Logins (Auto-Determined Roles on /auth)
You can click any of the 1-click accounts on the login page, or type:

Officer Account	Department & Role	Default Dashboard
control.hq@pmc.gov.in	👮 Municipal Control Room	Central Command Center
pwd.chief@pmc.gov.in	🏗️ PWD Chief Engineer	Road Intelligence & Potholes
fleet.ctrl@pmpml.gov.in	🚌 Transport Control Officer	Live Bus Operations
sysadmin@bel.gov.in	⚙️ System Administrator	System Settings & PostGIS DB
🚀 Running the 12-Step Live Fleet Demo
Once you are on the Command Center page:

Click Launch Fleet Demo in the top action bar.
The interactive modal will step through the full automated edge AI cycle:
Bus 102 detects pothole → Multi-bus spatial verification by Bus 217 → Explainable priority score (88/100) → PWD contractor repair → Automated transit recheck pass by Bus 304 → Autonomous resolution.