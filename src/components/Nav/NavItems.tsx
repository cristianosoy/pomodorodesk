import { FC } from "react";
import clsx from "clsx";

export const NavItem: FC<{
  onClick?: () => void;
  toggled?: boolean;
  shown?: boolean;
}> = ({ children, onClick, toggled, shown }) => {
  if (shown) {
    return (
      <li>
        <button
          className={clsx(
            "relative flex h-14 items-center bg-white px-4 dark:bg-gray-800 dark:text-white sm:h-16 sm:px-6 hover:bg-gray-200 hover:dark:bg-gray-700 transition-colors duration-200",
            toggled &&
              "border-b-2 border-black bg-violet-500 text-white dark:bg-violet-500 hover:bg-violet-400 hover:dark:bg-violet-400"
          )}
          onClick={onClick}
        >
          {children}
        </button>
      </li>
    );
  } else {
    return <></>;
  }
};
