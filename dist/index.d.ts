import React from "react";
import { useLocation, RouteObject, Params, PathRouteProps, LayoutRouteProps, IndexRouteProps } from "react-router-dom";
export interface PathPattern<Path extends string = string> {
    path: Path;
    caseSensitive?: boolean;
    end?: boolean;
}
declare type Location = ReturnType<typeof useLocation>;
export interface Options {
    disableDefaults?: boolean;
    excludePaths?: string[];
    defaultFormatter?: (str: string) => string;
}
export interface BreadcrumbMatch<ParamKey extends string = string> {
    params: Params<ParamKey>;
    pathname: string;
    pattern: PathPattern;
    route?: BreadcrumbsRoute;
}
export interface BreadcrumbComponentProps<ParamKey extends string = string> {
    key: string;
    match: BreadcrumbMatch<ParamKey>;
    location: Location;
}
export declare type BreadcrumbComponentType<ParamKey extends string = string> = React.ComponentType<BreadcrumbComponentProps<ParamKey>>;
export interface BreadcrumbsRoute<ParamKey extends string = string> extends RouteObject {
    children?: BreadcrumbsRoute[];
    breadcrumb?: BreadcrumbComponentType<ParamKey> | string | null;
    props?: {
        [x: string]: unknown;
    };
}
export interface BreadcrumbData<ParamKey extends string = string> {
    match: BreadcrumbMatch<ParamKey>;
    location: Location;
    key: string;
    breadcrumb: React.ReactNode;
}
export declare const humanize: (str: string) => string;
export declare const getBreadcrumbs: ({ routes, location, options, }: {
    routes: BreadcrumbsRoute[];
    location: Location;
    options?: Options | undefined;
}) => BreadcrumbData[];
declare const useReactRouterBreadcrumbs: (routes?: BreadcrumbsRoute<string>[] | undefined, options?: Options | undefined) => BreadcrumbData[];
export default useReactRouterBreadcrumbs;
export declare function createRoutesFromChildren(children: React.ReactNode): BreadcrumbsRoute[];
declare type BreadCrumb = {
    breadcrumb?: string | ((param: any) => JSX.Element) | JSX.Element | null;
};
declare type BreadCrumbRouteType = (_props: PathRouteProps | LayoutRouteProps | (IndexRouteProps & BreadCrumb)) => React.ReactElement | null;
declare const BreadCrumbRoute: BreadCrumbRouteType;
export { BreadCrumbRoute as Route };
