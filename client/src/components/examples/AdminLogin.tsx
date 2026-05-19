import AdminLogin from "../admin/AdminLogin";

export default function AdminLoginExample() {
  return (
    <AdminLogin 
      onLogin={() => console.log("Login success")} 
      onBack={() => console.log("Back clicked")} 
    />
  );
}
