import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import {
  createStyles,
  makeStyles,
  Paper,
  Theme,
  useTheme,
} from "@material-ui/core";
import TopBar from "components/TopBar";
import BottomNav from "components/BottomNav";
import { useTitleContext } from "libs/title";
import { useAuth } from "libs/auth";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      height: "var(--100vh, 0px)",
      width: "100vw",
      overflowY: "scroll",
      overscrollBehavior: "none",
      background: theme.palette.background.default,
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 600,
    },
    main: {
      width: "100%",
      paddingTop: "calc(env(safe-area-inset-top) + 56px)",
      paddingBottom: "calc(env(safe-area-inset-bottom) + 56px)",
    },
    bottomNav: {
      position: "fixed",
      bottom: 0,
      left: 0,
      width: "100%",
      zIndex: 600,
    },
  })
);

const MainLayout: React.VFC<PropsWithChildren<unknown>> = ({ children }) => {
  const classes = useStyles();
  const titleCtx = useTitleContext();
  const auth = useAuth();
  const theme = useTheme<Theme>();

  const [scrollTop, setScrollTop] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    setScrollTop(root.current ? root.current.scrollTop : 0);
  };

  useEffect(() => {
    const ref = root.current;
    if (!ref) return;
    ref.addEventListener("scroll", onScroll);
    return () => {
      ref.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.background = theme.palette.background.default;
  }, [theme.palette.background.default, theme.palette.type]);

  return (
    <Paper className={classes.root} square={true} ref={root}>
      <TopBar
        title={titleCtx.title}
        scrollTop={scrollTop}
        className={classes.topBar}
      />
      <main className={classes.main}>{children}</main>
      {auth.get_current_user_id() && (
        <BottomNav className={classes.bottomNav} />
      )}
    </Paper>
  );
};

export default MainLayout;
