import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import NotFound from "../pages/NotFound/NotFound";

import Employer from "../pages/Employer/Employer";
import CreateCompany from "../pages/CreateCompany/CreateCompany";
import AddJob from "../pages/AddJob/AddJob";
import BrowseCategory from "../pages/BrowseCategory/BrowseCategory";
import BrowseJob from "../pages/BrowseJob/BrowseJob";
import Seeker from "../pages/Seeker/Seeker";
import JobDetail from "../pages/JobDetail/JobDetail";
import CreateCV from "../pages/CreateCv/CreateCv";
import CvPreview from "../pages/CvPreview/CvPreview";
import CategoryManagement from "../pages/CategoryManagent/CategoryManagent";
import Company from "../pages/Company/Company";
import CVList from "../pages/CVList/CVList";
import EmployerApplications from "../pages/EmployerApplications/EmployerApplications";
import SeekerApplications from "../pages/SeekerApplications/SeekerApplications";
import RolePermissionManagement from "../pages/RolePermissionManagement/RolePermissionManagement";
import RoleManagement from "../pages/RoleManagement/RoleManagement";
import PermissionManagement from "../pages/PermissionManagement/PermissionManagement";
import SkillManagement from "../pages/SkillManagement/SkillManagement";
import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import UserManagement from "../pages/UserManagement/UserManagement";
import UserProfileEdit from "../pages/UserProfileEdit/UserProfileEdit";
import Notifications from "../pages/Notifications/Notifications";
import ChangePassword from "../pages/ChangePassword/ChangePassword"; 

import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRouter() {
  return (
    <Router>
      <Routes>

        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/browse-categories" element={<BrowseCategory />} />
        <Route path="/browse-jobs" element={<BrowseJob />} />
        <Route path="/job-detail/:id" element={<JobDetail />} />

        <Route
          path="/employer"
          element={
            <ProtectedRoute requireRoles={["EMPLOYER", "ADMIN", "JOB_SEEKER"]} requireAllRoles={false}>
              <Employer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-company"
          element={
            <ProtectedRoute requireRoles={["EMPLOYER", "ADMIN"]} requireAllRoles={false}>
              <CreateCompany />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-job"
          element={
            <ProtectedRoute requirePermissions={["JOB_CREATE"]}>
              <AddJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer-applications"
          element={
            <ProtectedRoute requireRoles={["EMPLOYER", "ADMIN"]} requireAllRoles={false}>
              <EmployerApplications />
            </ProtectedRoute>
          }
        />

        {/* Seeker */}
        <Route
          path="/seeker"
          element={
            <ProtectedRoute requireRoles={["JOB_SEEKER", "ADMIN", "EMPLOYER"]} requireAllRoles={false}>
              <Seeker />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seeker-applications"
          element={
            <ProtectedRoute requireRoles={["JOB_SEEKER"]}>
              <SeekerApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-cv"
          element={
            <ProtectedRoute requireRoles={["JOB_SEEKER"]}>
              <CreateCV />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cv-preview"
          element={
            <ProtectedRoute requireRoles={["JOB_SEEKER", "ADMIN", "EMPLOYER"]} 
            requireAllRoles={false}
            >
              <CvPreview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cv-preview/:id"
          element={
            <ProtectedRoute requireRoles={["JOB_SEEKER", "ADMIN", "EMPLOYER"]}
             requireAllRoles={false}
            >
              <CvPreview />
            </ProtectedRoute>
          }
        />

        {/* Admin - Category */}
        <Route
          path="/category-management"
          element={
            <ProtectedRoute requirePermissions={["JOB_CATEGORY_CREATE"]}>
              <CategoryManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/skills-management"
          element={
            <ProtectedRoute requirePermissions={["SKILL_CREATE"]}>
              <SkillManagement />
            </ProtectedRoute>
          }
        />

        {/* Admin - Company */}
        <Route
          path="/company-list"
          element={
            <ProtectedRoute requirePermissions={["COMPANY_READ"]}>
              <Company />
            </ProtectedRoute>
          }
        />

        {/* Admin - CV */}
        <Route
          path="/cv-list"
          element={
            <ProtectedRoute requirePermissions={["USER_CV_READ"]}>
              <CVList />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requireRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requireRoles={["ADMIN"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-user-profile/:id"
          element={
            <ProtectedRoute
              requireRoles={["ADMIN", "JOB_SEEKER", "EMPLOYER"]}
              requireAllRoles={false}
            >
              <UserProfileEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles-permissions"
          element={
            <ProtectedRoute requireRoles={["ADMIN"]}>
              <RolePermissionManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute requireRoles={["ADMIN"]}>
              <RoleManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/permissions"
          element={
            <ProtectedRoute requireRoles={["ADMIN"]}>
              <PermissionManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute requireRoles={["ADMIN", "EMPLOYER", "JOB_SEEKER"]} requireAllRoles={false}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute requireRoles={["ADMIN", "EMPLOYER", "JOB_SEEKER"]} requireAllRoles={false}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}
