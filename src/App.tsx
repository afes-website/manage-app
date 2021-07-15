import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Theme, useMediaQuery, useTheme } from "@material-ui/core";
import TypesafeRouter from "components/TypesafeRouter";
import ProvidersProvider from "components/ProvidersProvider";
import MainLayout from "layouts/Main";
import TabletLayout from "layouts/Tablet";
import NotFound from "pages/NotFound";
import { createBrowserHistory } from "history";
import Auth, { AuthContext } from "libs/auth";
import routes from "libs/routes";

const App: React.VFC = () => {
  const [history] = useState(createBrowserHistory());
  const [provideVal, setProvideVal] = React.useState(() => ({
    val: new Auth(),
  }));
  React.useEffect(() => {
    provideVal.val.on_change(() => {
      setProvideVal((old) => ({ ...old }));
    });
  }, [provideVal.val]);

  const redirect_to_login = () => {
    if (
      !provideVal.val.get_current_user_id() &&
      ![routes.Login.route.create({}), routes.Terms.route.create({})].includes(
        history.location.pathname
      )
    ) {
      history.push(routes.Login.route.create({}));
    }
  };
  React.useEffect(redirect_to_login, [history, provideVal]);
  React.useEffect(() => {
    return history.listen(redirect_to_login);
  });

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return (
    <AuthContext.Provider value={provideVal}>
      <TypesafeRouter
        routes={routes}
        history={history}
        layout={LayoutWithProviders}
        fallback={NotFound}
      />
    </AuthContext.Provider>
  );
};

const LayoutWithProviders: React.VFC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const theme = useTheme<Theme>();
  const isTablet = useMediaQuery(theme.breakpoints.up("sm"));

  const Layout = useMemo(() => (isTablet ? TabletLayout : MainLayout), [
    isTablet,
  ]);

  return (
    <ProvidersProvider>
      <Layout>{children}</Layout>
    </ProvidersProvider>
  );
};

export default App;

const handleResize = () => {
  const height = window.innerHeight;
  document.documentElement.style.setProperty("--100vh", `${height}px`);
};
