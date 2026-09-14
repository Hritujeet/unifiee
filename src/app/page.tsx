import Image from "next/image";

export default function Home() {
  return (
    <div className="px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
      <h1 className="text-4xl font-heading font-extrabold tracking-tight leading-tight">
        Welcome to Unifiee
      </h1>
      <p className="text-muted-foreground mt-2">
        Your one-stop shop for all things Unifiee
      </p>
    </div>
  );
}
