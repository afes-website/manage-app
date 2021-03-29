import React, { useContext } from "react";
import { createStyles, makeStyles, Paper } from "@material-ui/core";
import TopBar from "components/TopBar";
import BottomNav from "components/BottomNav";
import { useTitleContext } from "libs/title";
import ProvidersProvider from "components/ProvidersProvider";
import { AuthContext } from "libs/auth";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      minHeight: "100vh",
      height: "max-content",
      background: theme.palette.background.default,
    },
    topBar: {
      position: "sticky",
      top: 0,
      width: "100%",
      zIndex: 600,
    },
    main: {
      paddingBottom: "56px", // bottom Nav
    },
    bottomNav: {
      position: "fixed",
      bottom: 0,
      width: "100%",
      zIndex: 600,
    },
  })
);

const MainLayout: React.FC = (props) => {
  const classes = useStyles();
  const titleCtx = useTitleContext();
  const auth = useContext(AuthContext).val;

  return (
    <Paper className={classes.root} square={true}>
      <div className={classes.topBar}>
        <TopBar title={titleCtx.title} />
      </div>
      <main className={classes.main}>{props.children}</main>
      <div className={classes.bottomNav}>
        {auth.get_current_user_id() && <BottomNav />}
      </div>
      <div className="sw-update-dialog" />
    </Paper>
  );
};

const MainLayoutWithProviders: React.FC = (props) => (
  <ProvidersProvider>
    <MainLayout>{props.children}</MainLayout>
  </ProvidersProvider>
);

export default MainLayoutWithProviders;
