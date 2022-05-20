import React, { createElement } from 'react';
import { useLocation, Route, matchPath } from 'react-router-dom';

var joinPaths = function joinPaths(paths) {
  return paths.join("/").replace(/\/\/+/g, "/");
};

var paramRe = /^:\w+$/;
var dynamicSegmentValue = 3;
var indexRouteValue = 2;
var emptySegmentValue = 1;
var staticSegmentValue = 10;
var splatPenalty = -2;

var isSplat = function isSplat(s) {
  return s === "*";
};

function computeScore(path, index) {
  var segments = path.split("/");
  var initialScore = segments.length;

  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }

  if (index) {
    initialScore += indexRouteValue;
  }

  return segments.filter(function (s) {
    return !isSplat(s);
  }).reduce(function (score, segment) {
    if (paramRe.test(segment)) {
      return score + dynamicSegmentValue;
    }

    if (segment === "") {
      return score + emptySegmentValue;
    }

    return score + staticSegmentValue;
  }, initialScore);
}

function compareIndexes(a, b) {
  var siblings = a.length === b.length && a.slice(0, -1).every(function (n, i) {
    return n === b[i];
  });
  return siblings ? a[a.length - 1] - b[b.length - 1] : 0;
}

function flattenRoutes(routes) {
  var branches = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var parentsMeta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var parentPath = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  routes.forEach(function (route, index) {
    var _a;

    if (typeof route.path !== "string" && !route.index && !((_a = route.children) === null || _a === void 0 ? void 0 : _a.length)) {
      throw new Error("useBreadcrumbs: `path` or `index` must be provided in every route object");
    }

    if (route.path && route.index) {
      throw new Error("useBreadcrumbs: `path` and `index` cannot be provided at the same time");
    }

    var meta = {
      relativePath: route.path || "",
      childrenIndex: index,
      route: route
    };

    if (meta.relativePath.charAt(0) === "/") {
      if (!meta.relativePath.startsWith(parentPath)) {
        throw new Error("useBreadcrumbs: The absolute path of the child route must start with the parent path");
      }

      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }

    var path = joinPaths([parentPath, meta.relativePath]);
    var routesMeta = parentsMeta.concat(meta);

    if (route.children && route.children.length > 0) {
      if (route.index) {
        throw new Error("useBreadcrumbs: Index route cannot have child routes");
      }

      flattenRoutes(route.children, branches, routesMeta, path);
    }

    branches.push({
      path: path,
      score: computeScore(path, route.index),
      routesMeta: routesMeta
    });
  });
  return branches;
}

function rankRouteBranches(branches) {
  return branches.sort(function (a, b) {
    return a.score !== b.score ? b.score - a.score : compareIndexes(a.routesMeta.map(function (meta) {
      return meta.childrenIndex;
    }), b.routesMeta.map(function (meta) {
      return meta.childrenIndex;
    }));
  });
}

var NO_BREADCRUMB = Symbol("NO_BREADCRUMB");
var humanize = function humanize(str) {
  return str.replace(/^[\s_]+|[\s_]+$/g, "").replace(/[-_\s]+/g, " ").replace(/^[a-z]/, function (m) {
    return m.toUpperCase();
  });
};

var render = function render(_ref) {
  var Breadcrumb = _ref.breadcrumb,
      match = _ref.match,
      location = _ref.location,
      props = _ref.props;
  var componentProps = Object.assign({
    match: match,
    location: location,
    key: match.pathname
  }, props || {});
  return Object.assign(Object.assign({}, componentProps), {
    breadcrumb: typeof Breadcrumb === "string" ? /*#__PURE__*/createElement("span", {
      key: componentProps.key
    }, Breadcrumb) : /*#__PURE__*/React.createElement(Breadcrumb, Object.assign({}, componentProps))
  });
};

var getDefaultBreadcrumb = function getDefaultBreadcrumb(_ref2) {
  var currentSection = _ref2.currentSection,
      location = _ref2.location,
      pathSection = _ref2.pathSection,
      defaultFormatter = _ref2.defaultFormatter;
  var match = matchPath({
    end: true,
    path: pathSection
  }, pathSection);
  return render({
    breadcrumb: defaultFormatter ? defaultFormatter(currentSection) : humanize(currentSection),
    match: match,
    location: location
  });
};

var getBreadcrumbMatch = function getBreadcrumbMatch(_ref3) {
  var currentSection = _ref3.currentSection,
      disableDefaults = _ref3.disableDefaults,
      excludePaths = _ref3.excludePaths,
      defaultFormatter = _ref3.defaultFormatter,
      location = _ref3.location,
      pathSection = _ref3.pathSection,
      branches = _ref3.branches;
  var breadcrumb;

  var getIsPathExcluded = function getIsPathExcluded(path) {
    return matchPath({
      path: path,
      end: true
    }, pathSection) != null;
  };

  if (excludePaths && excludePaths.some(getIsPathExcluded)) {
    return NO_BREADCRUMB;
  }

  branches.some(function (_ref4) {
    var path = _ref4.path,
        routesMeta = _ref4.routesMeta;
    var route = routesMeta[routesMeta.length - 1].route;
    var userProvidedBreadcrumb = route.breadcrumb;

    if (!userProvidedBreadcrumb && route.index) {
      var parentMeta = routesMeta[routesMeta.length - 2];

      if (parentMeta && parentMeta.route.breadcrumb) {
        userProvidedBreadcrumb = parentMeta.route.breadcrumb;
      }
    }

    var caseSensitive = route.caseSensitive,
        props = route.props;
    var match = matchPath({
      path: path,
      end: true,
      caseSensitive: caseSensitive
    }, pathSection);

    if (match && userProvidedBreadcrumb === null) {
      breadcrumb = NO_BREADCRUMB;
      return true;
    }

    if (match) {
      if (!userProvidedBreadcrumb && disableDefaults) {
        breadcrumb = NO_BREADCRUMB;
        return true;
      }

      breadcrumb = render({
        breadcrumb: userProvidedBreadcrumb || (defaultFormatter ? defaultFormatter(currentSection) : humanize(currentSection)),
        match: Object.assign(Object.assign({}, match), {
          route: route
        }),
        location: location,
        props: props
      });
      return true;
    }

    return false;
  });

  if (breadcrumb) {
    return breadcrumb;
  }

  if (disableDefaults) {
    return NO_BREADCRUMB;
  }

  return getDefaultBreadcrumb({
    pathSection: pathSection,
    currentSection: pathSection === "/" ? "Home" : currentSection,
    location: location,
    defaultFormatter: defaultFormatter
  });
};

var getBreadcrumbs = function getBreadcrumbs(_ref5) {
  var routes = _ref5.routes,
      location = _ref5.location,
      _ref5$options = _ref5.options,
      options = _ref5$options === void 0 ? {} : _ref5$options;
  var pathname = location.pathname;
  var branches = rankRouteBranches(flattenRoutes(routes));
  var breadcrumbs = [];
  pathname.split("?")[0].split("/").reduce(function (previousSection, currentSection, index) {
    var pathSection = !currentSection ? "/" : "".concat(previousSection, "/").concat(currentSection);

    if (pathSection === "/" && index !== 0) {
      return "";
    }

    var breadcrumb = getBreadcrumbMatch(Object.assign({
      currentSection: currentSection,
      location: location,
      pathSection: pathSection,
      branches: branches
    }, options));

    if (breadcrumb !== NO_BREADCRUMB) {
      breadcrumbs.push(breadcrumb);
    }

    return pathSection === "/" ? "" : pathSection;
  }, "");
  return breadcrumbs;
};

var useReactRouterBreadcrumbs = function useReactRouterBreadcrumbs(routes, options) {
  return getBreadcrumbs({
    routes: routes || [],
    location: useLocation(),
    options: options
  });
};

function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

function createRoutesFromChildren(children) {
  var routes = [];
  React.Children.forEach(children, function (element) {
    if (! /*#__PURE__*/React.isValidElement(element)) {
      return;
    }

    if (element.type === React.Fragment) {
      routes.push.apply(routes, createRoutesFromChildren(element.props.children));
      return;
    }

    invariant(element.type === Route, "[".concat(typeof element.type === "string" ? element.type : element.type.name, "] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>"));
    var route = {
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      index: element.props.index,
      path: element.props.path,
      breadcrumb: element.props.breadcrumb
    };

    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children);
    }

    routes.push(route);
  });
  return routes;
}
var BreadCrumbRoute = Route;

export default useReactRouterBreadcrumbs;
export { BreadCrumbRoute as Route, createRoutesFromChildren, getBreadcrumbs, humanize };
