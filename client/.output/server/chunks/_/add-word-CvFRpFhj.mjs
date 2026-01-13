import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, forwardRef, useContext, useMemo, useRef, useLayoutEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import WebApp from "@twa-dev/sdk";
import { _ as _$2 } from "@swc/helpers/_/_object_spread";
import { _ as _$1 } from "@swc/helpers/_/_object_spread_props";
import { _ } from "@swc/helpers/_/_object_without_properties";
import { R as Route, a as classNames, A as AppRootContext, c as canUseDOM } from "./router-7FD2lLE_.mjs";
import { _ as _$3 } from "@swc/helpers/_/_extends";
import { _ as _$4 } from "@swc/helpers/_/_object_destructuring_empty";
import "@tanstack/react-router";
import "zod";
import "@tanstack/react-router-ssr-query";
const callMultiple = (...fns) => (...args) => fns.filter((f) => typeof f === "function").forEach((f) => f(...args));
const hasReactNode = (value) => {
  return value !== void 0 && value !== false && value !== null && value !== "";
};
const useAppRootContext = () => {
  const appRootContext = useContext(AppRootContext);
  if (!appRootContext.isRendered) {
    throw new Error("[TGUI] Wrap your app with <AppRoot> component");
  }
  return appRootContext;
};
const usePlatform = () => {
  const context = useAppRootContext();
  return context.platform || "base";
};
const useEnhancedEffect = canUseDOM ? useLayoutEffect : useEffect;
const useTimeout = (callbackFunction, duration) => {
  const options = useRef({
    callbackFunction,
    duration
  });
  useEnhancedEffect(() => {
    options.current.callbackFunction = callbackFunction;
    options.current.duration = duration;
  }, [
    callbackFunction,
    duration
  ]);
  const timeout2 = useRef();
  const clear = useCallback(() => clearTimeout(timeout2 === null || timeout2 === void 0 ? void 0 : timeout2.current), []);
  const set = useCallback(() => {
    clear();
    timeout2.current = setTimeout(options.current.callbackFunction, options.current.duration);
  }, [
    clear
  ]);
  return {
    set,
    clear
  };
};
const RIPPLE_DELAY = 70;
const WAVE_LIVE = 225;
const useRipple = () => {
  const [clicks, setClicks] = useState([]);
  const pointerDelayTimers = useMemo(() => /* @__PURE__ */ new Map(), []);
  const clearClicks = useTimeout(() => setClicks([]), WAVE_LIVE);
  function addClick(x, y, pointerId) {
    const dateNow = Date.now();
    const filteredClicks = clicks.filter((click) => click.date + WAVE_LIVE > dateNow);
    setClicks([
      ...filteredClicks,
      {
        x,
        y,
        date: dateNow,
        pointerId
      }
    ]);
    clearClicks.set();
    pointerDelayTimers.delete(pointerId);
  }
  const onPointerDown = (e) => {
    const { top, left } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (left !== null && left !== void 0 ? left : 0);
    const y = e.clientY - (top !== null && top !== void 0 ? top : 0);
    pointerDelayTimers.set(e.pointerId, setTimeout(() => addClick(x, y, e.pointerId), RIPPLE_DELAY));
  };
  const onPointerCancel = (e) => {
    const timer = pointerDelayTimers.get(e.pointerId);
    clearTimeout(timer);
    pointerDelayTimers.delete(e.pointerId);
  };
  return {
    clicks,
    onPointerDown,
    onPointerCancel
  };
};
const Ripple = ({ clicks }) => /* @__PURE__ */ jsx("span", {
  "aria-hidden": true,
  className: "tgui-8071f6e38c77bc0b",
  children: clicks.map((wave) => /* @__PURE__ */ jsx("span", {
    className: "tgui-e156954daf886976",
    style: {
      top: wave.y,
      left: wave.x
    }
  }, wave.date))
});
const Tappable = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { Component: Component2 = "div", children, className, interactiveAnimation = "background", readOnly } = _param, restProps = _(_param, [
    "Component",
    "children",
    "className",
    "interactiveAnimation",
    "readOnly"
  ]);
  const platform = usePlatform();
  const { clicks, onPointerCancel, onPointerDown } = useRipple();
  const hasRippleEffect = platform === "base" && interactiveAnimation === "background" && !readOnly;
  return /* @__PURE__ */ jsxs(Component2, _$1(_$2({
    ref,
    className: classNames("tgui-b5d680db78c4cc2e", platform === "ios" && "tgui-34eb6f8b96874d40", interactiveAnimation === "opacity" && "tgui-7c5d6c1f6bbe3eaf", className),
    onPointerCancel,
    onPointerDown,
    readOnly
  }, restProps), {
    children: [
      hasRippleEffect && /* @__PURE__ */ jsx(Ripple, {
        clicks
      }),
      children
    ]
  }));
});
const stylesWeight = {
  "1": "tgui-5c92f90c2701fa17",
  "2": "tgui-809f1f8a3f64154d",
  "3": "tgui-5b8bdfbd2af10f59"
};
const Typography = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { weight = "3", Component: Component2 = "span", plain = true, caps, className } = _param, restProps = _(_param, [
    "weight",
    "Component",
    "plain",
    "caps",
    "className"
  ]);
  return /* @__PURE__ */ jsx(Component2, _$2({
    ref,
    className: classNames("tgui-c3e2e598bd70eee6", plain && "tgui-080a44e6ac3f4d27", weight && stylesWeight[weight], caps && "tgui-c602097b30e4ede9", className)
  }, restProps));
});
const subheadlineLevelStyles = {
  "1": "tgui-30064fce0d501f17",
  "2": "tgui-8f63cd31b2513281"
};
const Subheadline = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { level = "1", className, Component: Component2 } = _param, restProps = _(_param, [
    "level",
    "className",
    "Component"
  ]);
  return /* @__PURE__ */ jsx(Typography, _$1(_$2({}, restProps), {
    ref,
    className: classNames("tgui-266b6ffdbad2b90e", subheadlineLevelStyles[level], className),
    Component: Component2 || "h6"
  }));
});
const captionLevelStyles = {
  "1": "tgui-2916d621b0ea5857",
  "2": "tgui-937d123c23df98b3"
};
const Caption = (_param) => {
  var { level = "1", className, Component: Component2 } = _param, restProps = _(_param, [
    "level",
    "className",
    "Component"
  ]);
  return /* @__PURE__ */ jsx(Typography, _$1(_$2({}, restProps), {
    className: classNames("tgui-f37a43dcc29ade55", captionLevelStyles[level], className),
    Component: Component2 || "span"
  }));
};
const Text = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { weight, className, Component: Component2 } = _param, restProps = _(_param, [
    "weight",
    "className",
    "Component"
  ]);
  return /* @__PURE__ */ jsx(Typography, _$1(_$2({
    ref
  }, restProps), {
    weight,
    className: classNames("tgui-65c206f0fd891b6b", className),
    Component: Component2 || "span"
  }));
});
const titleLevelTags = {
  "1": "h2",
  "2": "h3",
  "3": "h4"
};
const titleLevelStyles = {
  "1": "tgui-2fc52ee93e8068a6",
  "2": "tgui-72c2a480384c4fb1",
  "3": "tgui-45c5f45d3e9105f4"
};
const Title = (_param) => {
  var { level = "2", className, Component: Component2 } = _param, restProps = _(_param, [
    "level",
    "className",
    "Component"
  ]);
  return /* @__PURE__ */ jsx(Typography, _$1(_$2({}, restProps), {
    className: classNames("tgui-da537051a4a87aec", titleLevelStyles[level], className),
    Component: Component2 || titleLevelTags[level]
  }));
};
const IconLarge$1 = (_param) => {
  var { children } = _param, restProps = _(_param, [
    "children"
  ]);
  return /* @__PURE__ */ jsxs("svg", _$1(_$2({
    width: "44",
    height: "44",
    viewBox: "0 0 44 44",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, restProps), {
    children: [
      /* @__PURE__ */ jsx("use", {
        xlinkHref: "#spinner_44",
        fill: "none",
        children
      }),
      /* @__PURE__ */ jsx("symbol", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 44 44",
        id: "spinner_44",
        children: /* @__PURE__ */ jsx("path", {
          d: "M22 4C25.1288 4 28.2036 4.81556 30.9211 6.36624C33.6386 7.91693 35.9049 10.1492 37.4967 12.8429C39.0884 15.5365 39.9505 18.5986 39.9979 21.727C40.0454 24.8555 39.2765 27.9423 37.7672 30.683C36.258 33.4237 34.0603 35.7236 31.3911 37.356C28.7219 38.9884 25.6733 39.8968 22.5459 39.9917C19.4185 40.0866 16.3204 39.3647 13.5571 37.8971C10.7939 36.4296 8.46085 34.2671 6.78817 31.6229",
          stroke: "currentColor",
          strokeWidth: "4",
          strokeLinecap: "round"
        })
      })
    ]
  }));
};
const IconMedium$1 = (_param) => {
  var { children } = _param, restProps = _(_param, [
    "children"
  ]);
  return /* @__PURE__ */ jsxs("svg", _$1(_$2({
    width: "36",
    height: "36",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, restProps), {
    children: [
      /* @__PURE__ */ jsx("use", {
        xlinkHref: "#spinner_36",
        fill: "none",
        children
      }),
      /* @__PURE__ */ jsx("symbol", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 36 36",
        id: "spinner_36",
        children: /* @__PURE__ */ jsx("path", {
          d: "M18 4c2.4335 0 4.825.63432 6.9386 1.84041S28.815 8.7827 30.053 10.8778c1.238 2.0951 1.9085 4.4766 1.9454 6.9099.0369 2.4332-.5611 4.8341-1.735 6.9657-1.1739 2.1317-2.8831 3.9205-4.9592 5.1902-2.0761 1.2696-4.4472 1.9762-6.8796 2.05-2.4324.0738-4.842-.4877-6.9913-1.6292-2.14918-1.1414-3.96375-2.8234-5.26472-4.8799",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round"
        })
      })
    ]
  }));
};
const IconSmall$1 = (_param) => {
  var { children } = _param, restProps = _(_param, [
    "children"
  ]);
  return /* @__PURE__ */ jsxs("svg", _$1(_$2({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, restProps), {
    children: [
      /* @__PURE__ */ jsx("use", {
        xlinkHref: "#spinner_24",
        fill: "none",
        children
      }),
      /* @__PURE__ */ jsx("symbol", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        id: "spinner_24",
        children: /* @__PURE__ */ jsx("path", {
          d: "M12 3c1.5644 0 3.1018.40778 4.4605 1.18312 1.3588.77535 2.492 1.89147 3.2878 3.23831.7959 1.34683 1.2269 2.87787 1.2507 4.44207.0237 1.5642-.3607 3.1076-1.1154 4.478-.7546 1.3703-1.8534 2.5203-3.188 3.3365-1.3347.8162-2.859 1.2704-4.4227 1.3179-1.5636.0474-3.11269-.3136-4.49433-1.0473-1.38163-.7338-2.54815-1.8151-3.38448-3.1371",
          stroke: "currentColor",
          strokeWidth: "2.2",
          strokeLinecap: "round"
        })
      })
    ]
  }));
};
const componentBySize = {
  s: IconSmall$1,
  m: IconMedium$1,
  l: IconLarge$1
};
const rotateCenterBySize = {
  s: 12,
  m: 18,
  l: 22
};
const BaseSpinner = ({ size }) => {
  const Component2 = componentBySize[size];
  const rotateCenter = rotateCenterBySize[size];
  return /* @__PURE__ */ jsx(Component2, {
    children: /* @__PURE__ */ jsx("animateTransform", {
      attributeName: "transform",
      attributeType: "XML",
      type: "rotate",
      from: `0 ${rotateCenter} ${rotateCenter}`,
      to: `360 ${rotateCenter} ${rotateCenter}`,
      dur: "0.7s",
      repeatCount: "indefinite"
    })
  });
};
const IconLarge = (_param) => {
  var { children } = _param, restProps = _(_param, [
    "children"
  ]);
  return /* @__PURE__ */ jsxs("svg", _$1(_$2({
    id: "l151:1947",
    width: "44",
    height: "44",
    viewBox: "0 0 44 44",
    xmlns: "http://www.w3.org/2000/svg"
  }, restProps), {
    children: [
      /* @__PURE__ */ jsx("g", {
        transform: "matrix(1,0,0,1,0,0)",
        children: /* @__PURE__ */ jsx("g", {
          id: "l151:1947",
          opacity: "1",
          style: {
            mixBlendMode: "normal"
          },
          children: /* @__PURE__ */ jsxs("g", {
            children: [
              /* @__PURE__ */ jsx("defs", {
                children: /* @__PURE__ */ jsx("clipPath", {
                  id: "l151:1947_clipPath",
                  x: "-50%",
                  y: "-50%",
                  width: "200%",
                  height: "200%",
                  children: /* @__PURE__ */ jsx("path", {
                    d: "M0,0h44v0v44v0h-44v0v-44z",
                    fill: "white",
                    clipRule: "nonzero"
                  })
                })
              }),
              /* @__PURE__ */ jsxs("g", {
                clipPath: "url(#l151:1947_clipPath)",
                children: [
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(-0.7071067811865475,-0.7071067811865476,0.7071067811865476,-0.7071067811865475,9.2715,37.5564)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1985",
                      opacity: "0.837",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1985_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v10c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-10c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(1,0,0,1,20,29)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1980",
                      opacity: "0.467",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1980_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v9c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-9c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(0.7071067811865476,-0.7071067811865475,0.7071067811865475,0.7071067811865476,24.8291,27.6569)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1982",
                      opacity: "0.153",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1982_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v10c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-10c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(6.123233995736766e-17,-1,1,6.123233995736766e-17,29,24)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1984",
                      opacity: "0.049",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1984_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v9c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-9c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(-0.7071067811865475,-0.7071067811865476,0.7071067811865476,-0.7071067811865475,27.6592,19.1716)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1986",
                      opacity: "0.01",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1986_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v10c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-10c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(1,0,0,1,20,2)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1979",
                      opacity: "0",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1979_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v9c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-9c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(0.7071067811865476,-0.7071067811865475,0.7071067811865475,0.7071067811865476,6.4473,9.2721)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1981",
                      opacity: "0",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1981_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v10c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-10c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(6.123233995736766e-17,-1,1,6.123233995736766e-17,2,24)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "l151:1983",
                      opacity: "1",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "l151:1983_fill_path",
                            d: "M2,0v0c1.10457,0 2,0.89543 2,2v9c0,1.10457 -0.89543,2 -2,2v0c-1.10457,0 -2,-0.89543 -2,-2v-9c0,-1.10457 0.89543,-2 2,-2z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  })
                ]
              })
            ]
          })
        })
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1985",
        attributeName: "opacity",
        values: "0.837;0;1;0.8366;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.75;0.87;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1980",
        attributeName: "opacity",
        values: "0.467;0;1;0.4669;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.63;0.75;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1982",
        attributeName: "opacity",
        values: "0.153;0.05;1;0.1534;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.5;0.63;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1984",
        attributeName: "opacity",
        values: "0.049;0;1;0.0493;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.37;0.5;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1986",
        attributeName: "opacity",
        values: "0.01;0;1;0.0099;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.25;0.37;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1979",
        attributeName: "opacity",
        values: "0;0;1;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.13;0.25;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1981",
        attributeName: "opacity",
        values: "0;1;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.13;0.89;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#l151:1983",
        attributeName: "opacity",
        values: "1;0;1",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.89;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      })
    ]
  }));
};
const IconMedium = (_param) => {
  var { children } = _param, restProps = _(_param, [
    "children"
  ]);
  return /* @__PURE__ */ jsxs("svg", _$1(_$2({
    xmlns: "http://www.w3.org/2000/svg",
    id: "m151:1947",
    width: "32",
    height: "32",
    viewBox: "0 0 32 32"
  }, restProps), {
    children: [
      /* @__PURE__ */ jsx("g", {
        transform: "matrix(1,0,0,1,0,0)",
        children: /* @__PURE__ */ jsx("g", {
          id: "m151:1947",
          opacity: "1",
          style: {
            mixBlendMode: "normal"
          },
          children: /* @__PURE__ */ jsxs("g", {
            children: [
              /* @__PURE__ */ jsx("defs", {
                children: /* @__PURE__ */ jsx("clipPath", {
                  id: "m151:1947_clipPath",
                  x: "-50%",
                  y: "-50%",
                  width: "200%",
                  height: "200%",
                  children: /* @__PURE__ */ jsx("path", {
                    d: "M0,0h32v0v32v0h-32v0v-32z",
                    fill: "white",
                    clipRule: "nonzero"
                  })
                })
              }),
              /* @__PURE__ */ jsxs("g", {
                clipPath: "url(#151:1947_clipPath)",
                children: [
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(-0.7071067811865475,-0.7071067811865476,0.7071067811865476,-0.7071067811865475,6.7429,27.3137)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1985",
                      opacity: "0.837",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1985_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v7.1818c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-7.1818c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(1,0,0,1,14.5454,21.0909)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1980",
                      opacity: "0.467",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1980_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v6.4545c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-6.4545c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(0.7071067811865476,-0.7071067811865475,0.7071067811865475,0.7071067811865476,18.0575,20.1141)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1982",
                      opacity: "0.153",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1982_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v7.1818c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-7.1818c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(6.123233995736766e-17,-1,1,6.123233995736766e-17,21.0909,17.4545)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1984",
                      opacity: "0.049",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1984_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v6.4545c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-6.4545c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(-0.7071067811865475,-0.7071067811865476,0.7071067811865476,-0.7071067811865475,20.1157,13.943)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1986",
                      opacity: "0.01",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1986_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v7.1818c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-7.1818c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(1,0,0,1,14.5454,1.4545)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1979",
                      opacity: "0",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1979_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v6.4545c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-6.4545c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(0.7071067811865476,-0.7071067811865475,0.7071067811865475,0.7071067811865476,4.6889,6.7433)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1981",
                      opacity: "0",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1981_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v7.1818c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-7.1818c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(6.123233995736766e-17,-1,1,6.123233995736766e-17,1.4545,17.4545)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "m151:1983",
                      opacity: "1",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "m151:1983_fill_path",
                            d: "M1.5,0v0c0.82843,0 1.5,0.67157 1.5,1.5v6.4545c0,0.82843 -0.67157,1.5 -1.5,1.5v0c-0.82843,0 -1.5,-0.67157 -1.5,-1.5v-6.4545c0,-0.82843 0.67157,-1.5 1.5,-1.5z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  })
                ]
              })
            ]
          })
        })
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1985",
        attributeName: "opacity",
        values: "0.837;0;1;0.8366;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.75;0.87;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1980",
        attributeName: "opacity",
        values: "0.467;0;1;0.4669;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.63;0.75;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1982",
        attributeName: "opacity",
        values: "0.153;0.05;1;0.1534;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.5;0.63;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1984",
        attributeName: "opacity",
        values: "0.049;0;1;0.0493;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.37;0.5;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1986",
        attributeName: "opacity",
        values: "0.01;0;1;0.0099;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.25;0.37;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1979",
        attributeName: "opacity",
        values: "0;0;1;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.13;0.25;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1981",
        attributeName: "opacity",
        values: "0;1;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.13;0.89;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#m151:1983",
        attributeName: "opacity",
        values: "1;0;1",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.89;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      })
    ]
  }));
};
const IconSmall = (_param) => {
  var { children } = _param, restProps = _(_param, [
    "children"
  ]);
  return /* @__PURE__ */ jsxs("svg", _$1(_$2({
    id: "s151:1947",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg"
  }, restProps), {
    children: [
      /* @__PURE__ */ jsx("g", {
        transform: "matrix(1,0,0,1,0,0)",
        children: /* @__PURE__ */ jsx("g", {
          id: "s151:1947",
          opacity: "1",
          style: {
            mixBlendMode: "normal"
          },
          children: /* @__PURE__ */ jsxs("g", {
            children: [
              /* @__PURE__ */ jsx("defs", {
                children: /* @__PURE__ */ jsx("clipPath", {
                  id: "s151:1947_clipPath",
                  x: "-50%",
                  y: "-50%",
                  width: "200%",
                  height: "200%",
                  children: /* @__PURE__ */ jsx("path", {
                    d: "M0,0h24v0v24v0h-24v0v-24z",
                    fill: "white",
                    clipRule: "nonzero"
                  })
                })
              }),
              /* @__PURE__ */ jsxs("g", {
                clipPath: "url(#151:1947_clipPath)",
                children: [
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(-0.7071067811865475,-0.7071067811865476,0.7071067811865476,-0.7071067811865475,5.64,19.78)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s151:1985",
                      opacity: "0.837",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s151:1985_fill_path",
                            d: "M1,0v0c0.55228,0 1,0.44772 1,1v5c0,0.55228 -0.44772,1 -1,1v0c-0.55228,0 -1,-0.44772 -1,-1v-5c0,-0.55228 0.44772,-1 1,-1z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(1,0,0,1,11,15)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s151:1980",
                      opacity: "0.467",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s151:1980_fill_path",
                            d: "M1,0v0c0.55228,0 1,0.44772 1,1v5c0,0.55228 -0.44772,1 -1,1v0c-0.55228,0 -1,-0.44772 -1,-1v-5c0,-0.55228 0.44772,-1 1,-1z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(0.7071067811865476,-0.7071067811865475,0.7071067811865475,0.7071067811865476,13.41,14.83)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s151:1982",
                      opacity: "0.153",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s151:1982_fill_path",
                            d: "M1,0v0c0.55228,0 1,0.44772 1,1v5c0,0.55228 -0.44772,1 -1,1v0c-0.55228,0 -1,-0.44772 -1,-1v-5c0,-0.55228 0.44772,-1 1,-1z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(6.123233995736766e-17,-1,1,6.123233995736766e-17,15,13)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s151:1984",
                      opacity: "0.049",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s151:1984_fill_path",
                            d: "M1,0v0c0.55228,0 1,0.44772 1,1v5c0,0.55228 -0.44772,1 -1,1v0c-0.55228,0 -1,-0.44772 -1,-1v-5c0,-0.55228 0.44772,-1 1,-1z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(1,0,0,1,13.41,4.22)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s597:11660",
                      opacity: "0",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s597:11660_fill_path",
                            d: "M2.0341,6.01101c-0.46533,0.46533 -1.21977,0.46533 -1.6851,0c-0.46533,-0.46533 -0.46533,-1.21977 0,-1.6851l3.97691,-3.97691c0.46533,-0.46533 1.21977,-0.46533 1.6851,0c0.46533,0.46533 0.46533,1.21977 0,1.6851z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(1,0,0,1,11,1.9998)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s151:1979",
                      opacity: "0",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s151:1979_fill_path",
                            d: "M1,0v0c0.55228,0 1,0.44772 1,1v5c0,0.55228 -0.44772,1 -1,1v0c-0.55228,0 -1,-0.44772 -1,-1v-5c0,-0.55228 0.44772,-1 1,-1z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(0.7071067811865476,-0.7071067811865475,0.7071067811865475,0.7071067811865476,4.22,5.64)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s151:1981",
                      opacity: "0",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s151:1981_fill_path",
                            d: "M1,0v0c0.55228,0 1,0.44772 1,1v5c0,0.55228 -0.44772,1 -1,1v0c-0.55228,0 -1,-0.44772 -1,-1v-5c0,-0.55228 0.44772,-1 1,-1z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  }),
                  /* @__PURE__ */ jsx("g", {
                    transform: "matrix(6.123233995736766e-17,-1,1,6.123233995736766e-17,2.0003,13)",
                    children: /* @__PURE__ */ jsx("g", {
                      id: "s151:1983",
                      opacity: "1",
                      style: {
                        mixBlendMode: "normal"
                      },
                      children: /* @__PURE__ */ jsx("g", {
                        children: /* @__PURE__ */ jsx("g", {
                          children: /* @__PURE__ */ jsx("path", {
                            id: "s151:1983_fill_path",
                            d: "M1,0v0c0.55228,0 1,0.44772 1,1v5c0,0.55228 -0.44772,1 -1,1v0c-0.55228,0 -1,-0.44772 -1,-1v-5c0,-0.55228 0.44772,-1 1,-1z",
                            fillRule: "nonzero",
                            fill: "currentColor",
                            fillOpacity: "1",
                            style: {
                              mixBlendMode: "normal"
                            }
                          })
                        })
                      })
                    })
                  })
                ]
              })
            ]
          })
        })
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s151:1985",
        attributeName: "opacity",
        values: "0.837;0;1;0.8366;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.75;0.87;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s151:1980",
        attributeName: "opacity",
        values: "0.467;0;1;0.4669;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.63;0.75;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s151:1982",
        attributeName: "opacity",
        values: "0.153;0.05;1;0.1534;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.5;0.63;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s151:1984",
        attributeName: "opacity",
        values: "0.049;0;1;0.0493;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.37;0.5;1;1;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s597:11660",
        attributeName: "opacity",
        values: "0;0;1;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.25;0.37;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s151:1979",
        attributeName: "opacity",
        values: "0;0;1;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.13;0.25;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s151:1981",
        attributeName: "opacity",
        values: "0;1;0;0",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.13;0.89;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      }),
      /* @__PURE__ */ jsx("animate", {
        href: "#s151:1983",
        attributeName: "opacity",
        values: "1;0;1",
        dur: "0.8s",
        repeatCount: "indefinite",
        calcMode: "spline",
        keyTimes: "0;0.89;1",
        keySplines: "0.5 0.35 0.15 1;0.5 0.35 0.15 1",
        additive: "replace",
        fill: "freeze"
      })
    ]
  }));
};
const IOSSpinner = ({ size }) => {
  switch (size) {
    case "l":
      return /* @__PURE__ */ jsx(IconLarge, {});
    case "m":
      return /* @__PURE__ */ jsx(IconMedium, {});
    default:
      return /* @__PURE__ */ jsx(IconSmall, {});
  }
};
const sizeStyles$2 = {
  s: "tgui-421d6dab8d2c78c1",
  m: "tgui-a636342f03bb5c08",
  l: "tgui-a53583a4b6d8fde0"
};
const Spinner = ({ size = "m", className }) => {
  const platform = usePlatform();
  const Component2 = platform === "ios" ? IOSSpinner : BaseSpinner;
  return /* @__PURE__ */ jsx("div", {
    role: "status",
    className: classNames("tgui-0ac8c3540e603b63", platform === "ios" && "tgui-562a3eae646b486d", sizeStyles$2[size], className),
    children: /* @__PURE__ */ jsx(Component2, {
      size
    })
  });
};
const ButtonTypography = (_param) => {
  var { size } = _param, restProps = _(_param, [
    "size"
  ]);
  if (size === "l") {
    return /* @__PURE__ */ jsx(Text, _$2({
      weight: "2"
    }, restProps));
  }
  return /* @__PURE__ */ jsx(Subheadline, _$2({
    level: "2",
    weight: "2"
  }, restProps));
};
const modeStyles$1 = {
  filled: "tgui-8a1ca9efa24f4809",
  bezeled: "tgui-91bda9a36246a33c",
  plain: "tgui-48956537c34690db",
  gray: "tgui-93106efd6b6d66ee",
  outline: "tgui-e884e36ff1faa596",
  white: "tgui-ba6d30cc81e39ae5"
};
const sizeStyles$1 = {
  s: "tgui-13f23a224303ddaa",
  m: "tgui-1a16a49d89076ff4",
  l: "tgui-9cef742a22f195c9"
};
const Button = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { type, size = "m", before, after, stretched, children, className, mode = "filled", loading, Component: Component2 = "button" } = _param, restProps = _(_param, [
    "type",
    "size",
    "before",
    "after",
    "stretched",
    "children",
    "className",
    "mode",
    "loading",
    "Component"
  ]);
  const platform = usePlatform();
  return /* @__PURE__ */ jsxs(Tappable, _$1(_$2({
    ref,
    type: type || "button",
    Component: Component2,
    className: classNames("tgui-117e77cd385a9c8d", mode && modeStyles$1[mode], size && sizeStyles$1[size], platform === "ios" && "tgui-55e8aa7f5cea2280", stretched && "tgui-726846958fe7f4a0", loading && "tgui-490cb0f5ec4998f3", className)
  }, restProps), {
    children: [
      loading && /* @__PURE__ */ jsx(Spinner, {
        className: "tgui-014f2b7d196b090d",
        size: "s"
      }),
      hasReactNode(before) && /* @__PURE__ */ jsx("div", {
        className: "tgui-06cc94d03a7c4dd7",
        children: before
      }),
      /* @__PURE__ */ jsx(ButtonTypography, {
        className: "tgui-5f6014c0f063b6de",
        size,
        children
      }),
      hasReactNode(after) && /* @__PURE__ */ jsx("div", {
        className: "tgui-8310172a5320ab71",
        children: after
      })
    ]
  }));
});
const modeStyles = {
  bezeled: "tgui-93cba8aff2e72079",
  plain: "tgui-08ef1486bc111162",
  gray: "tgui-2250ff52f0b5cf71",
  outline: "tgui-53781f3cf83e8be1"
};
const sizeStyles = {
  s: "tgui-b92d762e02762017",
  m: "tgui-024dfe77a8f2cfb0",
  l: "tgui-8ca1879e1128c105"
};
const IconButton = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { size = "m", mode = "bezeled", className, children } = _param, restProps = _(_param, [
    "size",
    "mode",
    "className",
    "children"
  ]);
  return /* @__PURE__ */ jsx(Tappable, _$1(_$2({
    ref,
    Component: "button",
    className: classNames("tgui-dda0e80fdf796ba5", modeStyles[mode], sizeStyles[size], className)
  }, restProps), {
    children
  }));
});
const List = (_param) => {
  var { className, children, Component: Component2 = "div" } = _param, restProps = _(_param, [
    "className",
    "children",
    "Component"
  ]);
  const platform = usePlatform();
  return /* @__PURE__ */ jsx(Component2, _$1(_$2({
    className: classNames("tgui-389a43acd684137a", platform === "ios" && "tgui-cfed40fe81d34ad5", className)
  }, restProps), {
    children
  }));
};
const FormInputTitle = (_param) => {
  var restProps = _$3({}, _$4(_param));
  const platform = usePlatform();
  if (platform === "ios") {
    return /* @__PURE__ */ jsx(Caption, _$2({
      caps: true
    }, restProps));
  }
  return /* @__PURE__ */ jsx(Subheadline, _$2({
    level: "2",
    weight: "2"
  }, restProps));
};
const platformStyles = {
  base: "tgui-8ca550c2fc85eff5",
  ios: "tgui-7707c5d942b7b9af"
};
const formStatusStyles = {
  default: "tgui-7584398855f80ae6",
  error: "tgui-41b168516bddcf4b",
  focused: "tgui-89277928456f0e30"
};
const FormInput = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { status, header, before, after, disabled, children, className, onFocus: onFocusProp, onBlur: onBlurProp } = _param, restProps = _(_param, [
    "status",
    "header",
    "before",
    "after",
    "disabled",
    "children",
    "className",
    "onFocus",
    "onBlur"
  ]);
  const platform = usePlatform();
  const [isFocused, setIsFocused] = useState(false);
  const formStatus = status || (isFocused ? "focused" : "default");
  const onFocus = callMultiple(onFocusProp, () => {
    if (disabled) {
      return;
    }
    setIsFocused(true);
  });
  const onBlur = callMultiple(onBlurProp, () => setIsFocused(false));
  return /* @__PURE__ */ jsxs("div", {
    ref,
    className: classNames("tgui-92da7016c7125c02", platformStyles[platform], formStatusStyles[formStatus], disabled && "tgui-4a83fef1f04acb0e"),
    "aria-disabled": disabled,
    children: [
      /* @__PURE__ */ jsxs("label", _$1(_$2({
        "aria-disabled": disabled,
        className: classNames("tgui-0f5050defacbf813", className),
        onFocus,
        onBlur
      }, restProps), {
        children: [
          hasReactNode(before) && /* @__PURE__ */ jsx("div", {
            className: "tgui-8f04eff653cfa5e5",
            children: before
          }),
          children,
          hasReactNode(after) && /* @__PURE__ */ jsx("div", {
            className: "tgui-16b3783d394bc7db",
            children: after
          })
        ]
      })),
      hasReactNode(header) && platform === "base" && /* @__PURE__ */ jsx(FormInputTitle, {
        className: "tgui-9f9a52f695b85cc9",
        children: header
      })
    ]
  });
});
const Textarea = /* @__PURE__ */ forwardRef((_param, ref) => {
  var { header, status, className } = _param, restProps = _(_param, [
    "header",
    "status",
    "className"
  ]);
  const platform = usePlatform();
  const TypographyComponent = platform === "ios" ? Text : Subheadline;
  return /* @__PURE__ */ jsx(FormInput, {
    header,
    status,
    className: classNames("tgui-54ba5b4c7f1fd05a", platform === "ios" && "tgui-2453b62de8016bfa", className),
    children: /* @__PURE__ */ jsx(TypographyComponent, _$2({
      ref,
      Component: "textarea",
      className: "tgui-d40ec83150e66029"
    }, restProps))
  });
});
const API_BASE_URL = "https://europe-west1-pt-revise-word.cloudfunctions.net/api";
const CHECK_SIMILAR_WORD_KEY$1 = "check_similar_word_key";
const useCheckSimilarWorkQuery = ({
  word,
  chatID
}) => {
  return useQuery({
    queryKey: [CHECK_SIMILAR_WORD_KEY$1, chatID, word],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/similar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Telegram-Init-Data": WebApp.initData
          },
          body: JSON.stringify({
            word
          })
        }
      ).then((response2) => response2.json());
      return response;
    },
    initialData: null,
    enabled: false
  });
};
const CHECK_SIMILAR_WORD_KEY = "get_examples";
const useGetExamplesQuery = ({
  word,
  translation,
  chatID
}) => {
  return useQuery({
    initialData: { example: "" },
    queryKey: [CHECK_SIMILAR_WORD_KEY, chatID, word],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/example`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Telegram-Init-Data": WebApp.initData
          },
          body: JSON.stringify({
            word,
            translation
          })
        }
      ).then((response2) => response2.json());
      return response;
    },
    enabled: false
  });
};
const useSubmitWordMutation = () => {
  return useMutation({
    mutationFn: ({
      chatID,
      word,
      translation,
      example,
      imageUrl
    }) => {
      return fetch(`${API_BASE_URL}/chat/${chatID}/word/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Telegram-Init-Data": WebApp.initData
        },
        body: JSON.stringify({
          word,
          translation,
          example,
          imageUrl
        })
      });
    }
  });
};
const SEARCH_IMAGES_KEY = "search_images";
const useSearchImagesQuery = ({
  word,
  translation,
  chatID
}) => {
  return useQuery({
    initialData: null,
    queryKey: [SEARCH_IMAGES_KEY, chatID, word],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatID}/word/image/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Telegram-Init-Data": WebApp.initData
          },
          body: JSON.stringify({
            word,
            translation
          })
        }
      ).then((response2) => response2.json());
      return response;
    },
    enabled: false
  });
};
const ReloadIcon = ({ size, ...props }) => /* @__PURE__ */ jsxs(
  "svg",
  {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...props,
    children: [
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M19.9381 13C19.979 12.6724 20 12.3387 20 12C20 7.58172 16.4183 4 12 4C9.49042 4 7.25082 5.15552 5.77141 6.99988M4.06189 11C4.02104 11.3276 4 11.6613 4 12C4 16.4183 7.58172 20 12 20C14.548 20 16.8181 18.8091 18.2938 16.9155",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M5.77148 3V7H9.77148",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M18.2939 21V17H14.2939",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    ]
  }
);
var define_i18n_default2 = { word: "Palavra", translation: "Tradução", examples: "Exemplos", save: "Salvar" };
let timeout;
const debounce = (callback, time) => () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => callback(), time);
};
const AddWord = ({ chatID }) => {
  const chatIDParam = chatID;
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const checkSimilarWordQuery = useCheckSimilarWorkQuery({
    chatID: chatIDParam ?? "",
    word
  });
  const getExamplesQuery = useGetExamplesQuery({
    chatID: chatIDParam ?? "",
    word,
    translation
  });
  const searchImagesQuery = useSearchImagesQuery({
    chatID: chatIDParam ?? "",
    word,
    translation
  });
  const submitWordMutation = useSubmitWordMutation();
  const checkSimilarWordDebounced = debounce(
    () => checkSimilarWordQuery.refetch(),
    1e3
  );
  const onChangeWord = (e) => {
    const value = e.currentTarget.value;
    setWord(value);
    if (value) {
      checkSimilarWordDebounced();
    }
  };
  const onChangeTranslation = (e) => {
    const value = e.currentTarget.value;
    setTranslation(value);
  };
  const onChangeExample = (e) => {
    setExample(e.currentTarget.value);
  };
  const onSubmit = (e) => {
    e.preventDefault();
    submitWordMutation.mutate(
      {
        chatID: chatIDParam ?? "",
        word,
        translation,
        example,
        imageUrl: selectedImageUrl
      },
      {
        onSuccess: () => {
          WebApp.close();
        }
      }
    );
  };
  useEffect(() => {
    if (getExamplesQuery.data) {
      setExample(getExamplesQuery.data.example);
    }
  }, [getExamplesQuery.data]);
  const isPending = checkSimilarWordQuery.isFetching || getExamplesQuery.isFetching || searchImagesQuery.isFetching;
  const isDisabled = !word || !translation;
  return /* @__PURE__ */ jsxs("form", { className: "w-full h-full flex flex-col p-4", onSubmit, children: [
    /* @__PURE__ */ jsx(Title, { className: "text-center pb-5", level: "1", weight: "2", children: "Add new word" }),
    /* @__PURE__ */ jsxs(List, { children: [
      /* @__PURE__ */ jsx(
        Textarea,
        {
          name: "english",
          header: define_i18n_default2.word,
          onChange: onChangeWord,
          disabled: isPending,
          status: checkSimilarWordQuery.data?.words.length ? "error" : void 0
        }
      ),
      !!checkSimilarWordQuery.data?.words.length && /* @__PURE__ */ jsx("div", { className: "flex items-center text-red-600 justify-between px-[22px] pb-2 -mt-3 z-50", children: /* @__PURE__ */ jsxs(Caption, { children: [
        "You have similar words added:",
        " ",
        checkSimilarWordQuery.data.words.join(",")
      ] }) }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          name: "translation",
          header: define_i18n_default2.translation,
          onChange: onChangeTranslation,
          disabled: isPending
        }
      ),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          name: "examples",
          header: define_i18n_default2.examples,
          disabled: isPending,
          value: example,
          onChange: onChangeExample
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-[22px] pb-2 -mt-5", children: [
        /* @__PURE__ */ jsx(Caption, { children: "Generate example" }),
        /* @__PURE__ */ jsx(
          IconButton,
          {
            size: "s",
            mode: "plain",
            type: "button",
            onClick: () => getExamplesQuery.refetch(),
            children: /* @__PURE__ */ jsx(ReloadIcon, { size: 18 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-[22px]", children: [
        /* @__PURE__ */ jsx(Caption, { children: "Search Image" }),
        /* @__PURE__ */ jsx(
          IconButton,
          {
            size: "s",
            mode: "plain",
            type: "button",
            onClick: () => searchImagesQuery.refetch(),
            children: /* @__PURE__ */ jsx(ReloadIcon, { size: 18 })
          }
        )
      ] }),
      !!searchImagesQuery.data?.urls.length && /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto px-[22px] pb-4", children: searchImagesQuery.data.urls.map((url) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden ${selectedImageUrl === url ? "border-[#007aff]" : "border-transparent"}`,
          onClick: () => setSelectedImageUrl(url),
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: url,
              alt: "result",
              className: "h-24 w-24 object-cover"
            }
          )
        },
        url
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-1 flex-col justify-end", children: /* @__PURE__ */ jsx(
      Button,
      {
        className: "max-h-12",
        type: "submit",
        stretched: true,
        disabled: isDisabled,
        loading: isPending,
        children: define_i18n_default2.save
      }
    ) })
  ] });
};
const Component = () => {
  const {
    chat_id
  } = Route.useSearch();
  return /* @__PURE__ */ jsx(AddWord, { chatID: chat_id });
};
export {
  Component as component
};
