import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import {
  createStyles,
  Grid,
  makeStyles,
  Paper,
  Theme,
  useTheme,
} from "@material-ui/core";
import TopBar from "components/TopBar";
import SideNav from "components/SideNav";
import { useTitleContext } from "libs/title";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      height: "var(--100vh, 0px)",
      boxSizing: "border-box",
      paddingTop: "env(safe-area-inset-top)",
    },
    content: {
      height: "calc(var(--100vh, 0px) - env(safe-area-inset-top))",
      boxSizing: "border-box",
      width: "100%",
      overflowY: "scroll",
      overscrollBehavior: "none",
      background: theme.palette.background.default,
    },
    topBar: {
      position: "absolute",
      top: 0,
      right: 0,
      width: "100%",
      zIndex: 600,
    },
    main: {
      width: "100%",
      boxSizing: "border-box",
      padding: theme.spacing(8),
      paddingTop: 56,
      paddingBottom: "env(safe-area-inset-bottom)",
    },
  })
);

const TabletLayout: React.VFC<PropsWithChildren<unknown>> = ({ children }) => {
  const classes = useStyles();
  const titleCtx = useTitleContext();
  const theme = useTheme<Theme>();

  const [scrollTop, setScrollTop] = useState(0);
  const content = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    setScrollTop(content.current ? content.current.scrollTop : 0);
  };

  useEffect(() => {
    const ref = content.current;
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
    <Grid container className={classes.root}>
      <Grid item sm={4} md={3}>
        <SideNav className={classes.content} />
      </Grid>
      <Grid item sm={8} md={9}>
        <Paper
          square={true}
          ref={content}
          className={classes.content}
          elevation={0}
        >
          <Grid container className={classes.topBar}>
            <Grid item sm={4} md={3} />
            <Grid item sm={8} md={9}>
              <TopBar title={titleCtx.title} scrollTop={scrollTop} />
            </Grid>
          </Grid>
          <main className={classes.main}>{children}</main>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TabletLayout;
