import { providerUrl } from "../../../lib";

export default function Info() {
  return (
    <div id="text" className="col-span-2 px-4 py-4">
      <p className="pt-6">
        You are currently connected to:{" "}
        <a
          href={providerUrl}
          target="_blank"
          rel="noreferrer"
          className="text-white/80 transition-colors hover:text-white font-mono"
        >
          {providerUrl}
        </a>
      </p>
    </div>
  );
}
