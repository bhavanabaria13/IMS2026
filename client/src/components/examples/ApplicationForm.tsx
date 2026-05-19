import ApplicationForm from "../ApplicationForm";

export default function ApplicationFormExample() {
  return (
    <ApplicationForm 
      open={true} 
      onClose={() => console.log("Close clicked")} 
      onSuccess={() => console.log("Success")}
    />
  );
}
