import React from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  createStyles,
  makeStyles,
  Theme,
} from "@material-ui/core";
import { ArrowBackIos, AccountCircle } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import AccountDrawer from "@/components/AccountDrawer";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
      position: "absolute",
    },
    title: {
      flexGrow: 1,
    },
  })
);

interface Props {
  title: string;
}

const TopBar: React.FunctionComponent<Props> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isNeedBackButton, setIsNeedBackButton] = React.useState(
    history.location.pathname !== "/"
  );

  function onDrawerClose(): undefined {
    setIsDrawerOpen(false);
    return undefined;
  }

  const unListen = history.listen(() => {
    setIsNeedBackButton(history.location.pathname !== "/");
  });

  React.useEffect(() => {
    return () => {
      unListen();
    };
  });

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          {isNeedBackButton ? (
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              onClick={() => {
                history.goBack();
              }}
            >
              <ArrowBackIos />
            </IconButton>
          ) : (
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              onClick={() => {
                setIsDrawerOpen(true);
              }}
            >
              <AccountCircle />
            </IconButton>
          )}
          <Typography variant="h6" align="center" className={classes.title}>
            {props.title}
          </Typography>
        </Toolbar>
      </AppBar>
      <AccountDrawer isOpen={isDrawerOpen} onDrawerClose={onDrawerClose} />
    </div>
  );
};

TopBar.propTypes = {
  title: PropTypes.any,
};

export default TopBar;