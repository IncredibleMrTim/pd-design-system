const COMPONENTS = [
  {
    name: "DatePicker",
    description: "Pick a single date from a calendar in a popover.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">PD Design System</h1>
      <p className="mt-3 text-muted-foreground">
        A shared component library for Process Dynamics, built with Next.js, Tailwind CSS and
        shadcn.
      </p>

      <h2 className="mt-12 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Components
      </h2>
      <ul className="mt-4 divide-y rounded-lg border">
        {COMPONENTS.map((component) => (
          <li key={component.name} className="px-4 py-3">
            <p className="font-medium">{component.name}</p>
            <p className="text-sm text-muted-foreground">{component.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
