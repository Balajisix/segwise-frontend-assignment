# Segwise Frontend Test

> A pixel-perfect implementation of the Figma design with interactive data visualizations for spends, impressions, clicks, and installs.

## 🚀 Key Features

- 🔍 **Search & Filter**: Quickly search, sort, and apply multiple filters to your data.
- 📊 **Interactive Charts**: Visualize spends, impressions, clicks, and installs with dynamic graphs.
- ⚡ **Fast CSV Parsing**: Leverages [PapaParse](https://www.papaparse.com/) for lightning-fast data retrieval from CSV.
- - 👀 **Row Preview Available**: Instantly view detailed data for any row with a single click.
- 📄 **Pagination Implemented**: Seamlessly navigate large datasets with efficient pagination.

## 🛠 Technologies Used

<p align="center">
  <a href="https://vitejs.dev/">
    <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
  </a>
  <a href="https://reactjs.org/">
    <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  </a>
  <a href="https://www.npmjs.com/package/papaparse">
    <img src="https://img.shields.io/badge/PapaParse-FFCB2B?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAA30lEQVR4AWP4//8/AyUYTFxUzGxhYGB4eHhLS0t+X//38HHx8dPnz6FQ6b+1cuXB5Oeho2OzY0efPmyUpKSmlpa0tzcHIEvjv7++vvT/79+38HBwcvPv3DzksRERExdXV1UVlZGRkYmxsb+5ubkmJiaGIpuaGhoWFrY2BgYGBgWARsbo6MjLy8vDx8+zGjRvHnz5+GhoZ2dnbOzs7m5uYwMjJ+SEiKOjo6NjY2NTU1xdXW1tbV1dXW1tYWFhYGDYDnZv37+2VRUWCgokhoAAArhYGxwKvMeQAAAABJRU5ErkJggg==&logoColor=white" alt="PapaParse">
  </a>
  <a href="https://ui.shadcn.com/">
    <img src="https://img.shields.io/badge/shadcn--UI-06B6D4?logo=shadcn-ui&logoColor=white" alt="shadcn UI">
  </a>
</p>

# 🧰 Technology Overview

Segwise Frontend Test website is built with a modern, lightning-fast stack:
- **Vite**: Provides instant Hot Module Replacement (HMR) and ultra-fast build times.
- **React**: A declarative, component-based library for building dynamic UIs.
- **TypeScript**: Adds static typing for safer and more maintainable code.
- **Tailwind CSS**: A utility-first CSS framework for rapid, responsive styling.
- **shadcn/ui**: A set of accessible, customizable UI components built on Radix and Tailwind.
- **PapaParse**: Efficient CSV parsing in the browser, enabling fast data loading.

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/segwise-frontend-test.git
cd segwise-frontend-test

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 📋 Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Use the search bar or filter panel to narrow down data.
3. Toggle between **Table** and **Chart** views to explore different representations.
4. Click on any data row to view detailed insights.

## 📝 Project Structure

```plaintext
src/
├── assets/           # Static files (logo, icons)
├── components/       # Reusable UI components
│   ├── DataTable.tsx
│   ├── ChartView.tsx
│   ├── FilterBar.tsx
│   └── Footer.tsx
├── data/             # CSV and raw data files
├── pages/            # Route-level components
│   ├── Home.tsx
│   └── RowDetail.tsx
├── App.tsx           # App entry & routing
└── main.tsx          # Vite entry point
```

---

## 🚀 Live Demo

Experience Segwise in action: [View the Live Demo](https://segwise-assignment-balaji.vercel.app/) 🌐

---

## 📸 Screenshots

<p align="center">
  <img src="./public/home.png" alt="Home View" width="300" />
  <img src="./public/tableView.png" alt="Chart View" width="300" />
  <img src="./public/rowDetails.png" alt="Chart View" width="300" />
</p>

---

## 💡 My Learnings in this test

- **During this frontend development I learnt a new package Papaparse for csv reader.**
- **Learned and implemented shadcn ui during this development test**
- **Thanks for the opportunity given by Segwise.ai hope I did my test well and I am waiting for my results**.
