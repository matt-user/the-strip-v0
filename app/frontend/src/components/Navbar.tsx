
type NavbarProps = {
  views: string[];
  setRoute: (route: string) => void;
};

export const Navbar = ({ views, setRoute }: NavbarProps) => {

  return (
    <>
      <button
        className="text-3xl font-bold text-white"
        onClick={() => setRoute("")}
      >
        Strip
      </button>
      <div className="flex w-1/3 justify-around text-white">
        {views.map((viewName) => (
          <button
            key={viewName}
            className="text-lg px-4 py-2 text-white bg-transparent hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20"
            onClick={() => setRoute(viewName)}
          >
            {viewName}
          </button>
        ))}
      </div>
    </>
  );
};
