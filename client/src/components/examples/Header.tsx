import Header from "../Header";

export default function HeaderExample() {
  return (
    <Header 
      onApplyClick={() => console.log("Apply clicked")} 
      onAdminClick={() => console.log("Admin clicked")} 
    />
  );
}
