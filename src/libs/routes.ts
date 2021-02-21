import { typedRoute } from "@/components/TypesafeRouter";
import { route } from "typesafe-react-router";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ExhEnterScan from "@/pages/exh/EnterScan";
import ExhExitScan from "@/pages/exh/ExitScan";
import ExhScanHistory from "@/pages/exh/ScanHistory";
import GeneralEnterScan from "@/pages/general/EnterScan.tsx";

const routes = {
  Home: typedRoute(route(""), Home),
  Login: typedRoute(route("login"), Login),
  ExhEnterScan: typedRoute(route("exh/enter"), ExhEnterScan),
  ExhExitScan: typedRoute(route("exh/exit"), ExhExitScan),
  ExhScanHistory: typedRoute(route("exh/history"), ExhScanHistory),
  GeneralEnterScan: typedRoute(route("general/enter"), GeneralEnterScan),
};

export default routes;
