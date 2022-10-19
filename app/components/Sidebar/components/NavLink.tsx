// ref: https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/modules/NavLink.js
// This file is pulled almost 100% from react-router with the addition of one
// thing, automatic scroll to the active link. It's worth the copy paste because
// it avoids recalculating the link match again.
import { Location, createLocation, LocationDescriptor } from "history";
import * as React from "react";
import {
  __RouterContext as RouterContext,
  matchPath,
  match,
} from "react-router";
import { Link } from "react-router-dom";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import history from "~/utils/history";

const resolveToLocation = (
  to: LocationDescriptor | ((location: Location) => LocationDescriptor),
  currentLocation: Location
) => (typeof to === "function" ? to(currentLocation) : to);

const normalizeToLocation = (
  to: LocationDescriptor,
  currentLocation: Location
) => {
  return typeof to === "string"
    ? createLocation(to, null, undefined, currentLocation)
    : to;
};

const joinClassnames = (...classnames: (string | undefined)[]) => {
  return classnames.filter((i) => i).join(" ");
};

export type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  activeClassName?: string;
  activeStyle?: React.CSSProperties;
  scrollIntoViewIfNeeded?: boolean;
  exact?: boolean;
  replace?: boolean;
  isActive?: (match: match | null, location: Location) => boolean;
  location?: Location;
  strict?: boolean;
  to: LocationDescriptor;
  onBeforeClick?: () => void;
};

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
const NavLink = ({
  "aria-current": ariaCurrent = "page",
  activeClassName = "active",
  activeStyle,
  className: classNameProp,
  exact,
  isActive: isActiveProp,
  location: locationProp,
  strict,
  replace,
  style: styleProp,
  scrollIntoViewIfNeeded,
  onClick,
  onBeforeClick,
  to,
  ...rest
}: Props) => {
  const linkRef = React.useRef(null);
  const context = React.useContext(RouterContext);
  const [preActive, setPreActive] = React.useState<boolean | undefined>(
    undefined
  );
  const currentLocation = locationProp || context.location;
  const toLocation = normalizeToLocation(
    resolveToLocation(to, currentLocation),
    currentLocation
  );
  const { pathname: path } = toLocation;

  const match = path
    ? matchPath(currentLocation.pathname, {
        // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
        path: path.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1"),
        exact,
        strict,
      })
    : null;

  const isActive =
    preActive ??
    !!(isActiveProp ? isActiveProp(match, currentLocation) : match);
  const className = isActive
    ? joinClassnames(classNameProp, activeClassName)
    : classNameProp;
  const style = isActive ? { ...styleProp, ...activeStyle } : styleProp;

  React.useLayoutEffect(() => {
    if (isActive && linkRef.current && scrollIntoViewIfNeeded !== false) {
      scrollIntoView(linkRef.current, {
        scrollMode: "if-needed",
        behavior: "auto",
      });
    }
  }, [linkRef, scrollIntoViewIfNeeded, isActive]);

  const shouldHandleEvent = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>): boolean => {
      return (
        !event.defaultPrevented && // onClick prevented default
        event.button === 0 && // ignore everything but left clicks
        !rest.target && // let browser handle "target=_blank" etc.
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey
      );
    },
    [rest.target]
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);

      if (shouldHandleEvent(event)) {
        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.focus();

        setPreActive(true);

        // Wait a frame until following the link
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (replace) {
              history.replace(to);
            } else {
              history.push(to);
            }
          });
          event.currentTarget?.blur();
        });
      }
    },
    [onClick, replace, to, shouldHandleEvent]
  );

  React.useEffect(() => {
    setPreActive(undefined);
  }, [currentLocation]);

  return (
    <Link
      key={isActive ? "active" : "inactive"}
      ref={linkRef}
      onMouseDown={handleClick}
      onClick={(event) => {
        if (shouldHandleEvent(event)) {
          event.stopPropagation();
          event.preventDefault();
        }
      }}
      aria-current={(isActive && ariaCurrent) || undefined}
      className={className}
      style={style}
      to={toLocation}
      replace={replace}
      {...rest}
    />
  );
};

export default NavLink;
