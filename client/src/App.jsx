import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentNotes from "./pages/StudentNotes";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => (
	<Routes>
		<Route element={<Layout />}>
			<Route index element={<Home />} />
			<Route path="login" element={<Login />} />
			<Route path="register" element={<Register />} />
			<Route element={<ProtectedRoute allow={["student"]} />}>
				<Route path="student" element={<StudentDashboard />} />
				<Route path="student/profile" element={<StudentProfile />} />
				<Route path="student/notes" element={<StudentNotes />} />
			</Route>
			<Route element={<ProtectedRoute allow={["parent"]} />}>
				<Route path="parent" element={<ParentDashboard />} />
			</Route>
			<Route element={<ProtectedRoute allow={["admin"]} />}>
				<Route path="admin" element={<AdminDashboard />} />
			</Route>
			<Route path="*" element={<NotFound />} />
		</Route>
	</Routes>
);

export default App;
