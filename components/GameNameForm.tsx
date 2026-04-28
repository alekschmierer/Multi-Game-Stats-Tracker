"use client";

export default function GameForm({
  action,
  state,
  placeholder,
  name = "playerTag",
}: {
  action: any;
  state: any;
  placeholder: string;
  name?: string;
}) {
  return (
    <div className="space-y-2 mb-6">

      <form action={action}>
        <input
          name={name}
          type="text"
          defaultValue={state?.tag || ""}
          placeholder={placeholder}
          className="border p-2 rounded w-full"
        />
      </form>

      {state?.error && (
        <div className="text-red-500">
          <p>Error: {state.error}</p>
        </div>
      )}
    </div>
  );
}