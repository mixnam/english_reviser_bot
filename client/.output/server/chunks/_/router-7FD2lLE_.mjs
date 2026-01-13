import { createRouter, createRootRouteWithContext, createFileRoute, lazyRouteComponent, Outlet, HeadContent, Scripts } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, forwardRef, createContext, useContext, useState, useCallback, useRef } from "react";
import { _ as _$2 } from "@swc/helpers/_/_object_spread";
import { _ as _$1 } from "@swc/helpers/_/_object_spread_props";
import { _ } from "@swc/helpers/_/_object_without_properties";
import { z } from "zod";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
const isObjectLike = (object) => {
  return typeof object === "object" && object !== null;
};
const isEqual = (value, other) => {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
    return false;
  }
  if (isObjectLike(value) && isObjectLike(other)) {
    if (Object.keys(value).length !== Object.keys(other).length) {
      return false;
    }
    for (const prop in value) {
      if (Object.prototype.hasOwnProperty.call(value, prop) && Object.prototype.hasOwnProperty.call(other, prop)) {
        if (!isEqual(value[prop], other[prop])) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
};
const useObjectMemo = (object) => {
  const cache = useRef(object);
  if (!isEqual(cache.current, object)) {
    cache.current = object;
  }
  return cache.current;
};
function classNames(...args) {
  const result = [];
  args.forEach((item) => {
    if (!item) {
      return;
    }
    switch (typeof item) {
      case "string":
        result.push(item);
        break;
      case "object":
        Object.keys(item).forEach((key) => {
          if (item[key]) {
            result.push(key);
          }
        });
        break;
      default:
        result.push(`${item}`);
    }
  });
  return result.join(" ");
}
const AppRootContext = createContext({
  isRendered: false
});
const canUseDOM = (() => !!(typeof window !== "undefined" && window.document && window.document.createElement))();
const setRef = (element1, ref) => {
  if (ref) {
    if (typeof ref === "function") {
      ref(element1);
    } else {
      ref.current = element1;
    }
  }
};
const multipleRef = (...refs) => {
  let current = null;
  return {
    get current() {
      return current;
    },
    set current(element) {
      current = element;
      refs.forEach((ref) => ref && setRef(element, ref));
    }
  };
};
const getTelegramData = () => {
  var _window_Telegram;
  if (!canUseDOM) {
    return void 0;
  }
  return (_window_Telegram = window.Telegram) === null || _window_Telegram === void 0 ? void 0 : _window_Telegram.WebApp;
};
const getBrowserAppearanceSubscriber = (setAppearance) => {
  if (!canUseDOM || !window.matchMedia) {
    return () => {
    };
  }
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => {
    setAppearance(mediaQuery.matches ? "dark" : "light");
  };
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
};
const getInitialAppearance = () => {
  if (canUseDOM && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};
const useAppearance = (appearanceProp) => {
  const { appearance: contextAppearance } = useContext(AppRootContext);
  const [appearance, setAppearance] = useState(appearanceProp || contextAppearance || getInitialAppearance());
  const handleThemeChange = useCallback(() => {
    const telegramData = getTelegramData();
    if (!telegramData) {
      return;
    }
    setAppearance(telegramData.colorScheme);
  }, []);
  useEffect(() => {
    if (appearanceProp !== void 0) {
      setAppearance(appearanceProp);
      return () => {
      };
    }
    const telegramData = getTelegramData();
    if (telegramData) {
      telegramData.onEvent("themeChanged", handleThemeChange);
      return () => telegramData.offEvent("themeChanged", handleThemeChange);
    }
    return getBrowserAppearanceSubscriber(setAppearance);
  }, [
    appearanceProp
  ]);
  return appearance;
};
const getInitialPlatform = () => {
  const telegramData = getTelegramData();
  if (!telegramData) {
    return "base";
  }
  if ([
    "ios",
    "macos"
  ].includes(telegramData.platform)) {
    return "ios";
  }
  return "base";
};
const usePlatform = (platform) => {
  if (platform !== void 0) {
    return platform;
  }
  const appContext = useContext(AppRootContext);
  if (appContext.isRendered && appContext.platform !== void 0) {
    return appContext.platform;
  }
  return getInitialPlatform();
};
const usePortalContainer = (portalContainer) => {
  if (portalContainer !== void 0) {
    return portalContainer;
  }
  const appContext = useContext(AppRootContext);
  if (appContext.isRendered && appContext.portalContainer !== void 0) {
    return appContext.portalContainer;
  }
  return useRef(null);
};
const AppRoot = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { platform: platformProp, appearance: appearanceProp, portalContainer: portalContainerProp, children, className } = _param, restProps = _(_param, [
    "platform",
    "appearance",
    "portalContainer",
    "children",
    "className"
  ]);
  const appearance = useAppearance(appearanceProp);
  const portalContainer = usePortalContainer(portalContainerProp);
  const platform = usePlatform(platformProp);
  const contextValue = useObjectMemo({
    platform,
    appearance,
    portalContainer,
    isRendered: true
  });
  return /* @__PURE__ */ jsx("div", _$1(_$2({
    ref: multipleRef(ref, portalContainer),
    className: classNames("tgui-6a12827a138e8827", platform === "ios" && "tgui-56dbb42c1dbd5e2b", appearance === "dark" && "tgui-865b921add8ee075", className)
  }, restProps), {
    children: /* @__PURE__ */ jsx(AppRootContext.Provider, {
      value: contextValue,
      children
    })
  }));
});
const Route$1 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "TanStack Start Starter"
      }
    ]
  }),
  component: RootComponent
});
function RootComponent() {
  useEffect(() => {
    import("@twa-dev/sdk").then((app) => {
      app.default.ready();
    });
  }, []);
  return /* @__PURE__ */ jsx(RootDocument, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(AppRoot, { className: "h-full w-full", suppressHydrationWarning: true, children }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter = () => import("./add-word-CvFRpFhj.mjs");
const validateParams = z.object({
  chat_id: z.string().catch("")
});
const Route = createFileRoute("/add-word")({
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  validateSearch: validateParams,
  ssr: false
});
const AddWordRoute = Route.update({
  id: "/add-word",
  path: "/add-word",
  getParentRoute: () => Route$1
});
const rootRouteChildren = {
  AddWordRoute
};
const routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    context: {
      queryClient
    }
  });
  setupRouterSsrQueryIntegration({
    router: router2,
    queryClient
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  AppRootContext as A,
  Route as R,
  classNames as a,
  canUseDOM as c,
  router as r
};
