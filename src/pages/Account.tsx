import React, { useState } from "react";
import {
  Button,
  Card,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";
import { AddCircleOutline, RemoveCircleOutline } from "@material-ui/icons";
import AccountIcon from "components/AccountIcon";
import { PermissionsList } from "components/AccountDrawer";
import { useAuth } from "libs/auth";
import { useTitleSet } from "libs/title";
import routes from "libs/routes";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: theme.spacing(2),
      "& > * + *": {
        marginTop: theme.spacing(2),
      },
    },
    currentUser: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: theme.spacing(2),
    },
    currentUserIcon: {
      fontSize: 64,
      marginBottom: theme.spacing(1),
    },
    currentUserPerm: {
      marginTop: theme.spacing(2),
    },
    grid: {
      width: "100%",
    },
    disabledIcon: {
      opacity: theme.palette.action.disabledOpacity,
    },
    listIcon: {
      fontSize: 32,
    },
    logoutButton: {
      color: theme.palette.error.main,
    },
    actionButton: {
      paddingLeft: theme.spacing(2),
      justifyContent: "left",
      width: "100%",
    },
    permissionsList: {
      display: "flex",
      height: "min-content",
      marginTop: theme.spacing(0.5),
      "& > * + *": {
        marginLeft: theme.spacing(0.5),
      },
    },
  })
);

const Account: React.VFC = () => {
  useTitleSet("アカウント");
  const classes = useStyles();
  const auth = useAuth();

  const [isLogoutAlertVisible, setIsLogoutAlertVisible] = useState(false);

  return (
    <Grid container spacing={2} className={classes.root}>
      {/* ==== current user ==== */}
      <Grid item xs={12} className={classes.currentUser}>
        <AccountIcon
          account={auth.get_current_user()}
          className={classes.currentUserIcon}
          color="inherit"
        />
        <Typography variant="h6">
          {auth.get_current_user()?.name || ""}
        </Typography>
        <Typography variant="body2">
          @{auth.get_current_user()?.id || ""}
        </Typography>
        <PermissionsList className={classes.currentUserPerm} />
      </Grid>

      {/* ==== account list ==== */}
      {Object.values(auth.get_all_users()).length > 1 && (
        <Grid item xs={12} sm={10} md={8} className={classes.grid}>
          <Typography variant="overline">アカウント切り替え</Typography>
          <Card>
            <List disablePadding>
              {Object.values(auth.get_all_users())
                .filter((account) => account.id !== auth.get_current_user()?.id)
                .map((account, index, array) => {
                  return (
                    <React.Fragment key={account.id}>
                      <ListItem
                        button
                        onClick={() => {
                          auth.switch_user(account.id);
                        }}
                      >
                        <ListItemAvatar>
                          <AccountIcon
                            account={account}
                            className={classes.listIcon}
                            color="inherit"
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={account.name}
                          secondary={"@" + account.id}
                        />
                      </ListItem>
                      {index !== array.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  );
                })}
            </List>
          </Card>
        </Grid>
      )}

      {/* ==== login / logout ==== */}
      <Grid item xs={12} sm={10} md={8} className={classes.grid}>
        <Button
          className={classes.actionButton}
          color="secondary"
          startIcon={<AddCircleOutline />}
          component={Link}
          to={routes.Login.route.create({})}
        >
          アカウントを追加（ログイン）
        </Button>
        <Button
          className={[classes.actionButton, classes.logoutButton].join(" ")}
          startIcon={<RemoveCircleOutline />}
          onClick={() => {
            setIsLogoutAlertVisible(true);
          }}
        >
          @{auth.get_current_user_id()} からログアウト
        </Button>
      </Grid>

      {/* ==== dialogs ==== */}
      <Dialog open={isLogoutAlertVisible}>
        <DialogTitle>ログアウトしますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            @{auth.get_current_user_id()} からログアウトしますか？
          </DialogContentText>
          <DialogContentText>
            {`ログアウト後、再び @${auth.get_current_user_id()} を使用するにはパスワードが必要です。`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsLogoutAlertVisible(false);
            }}
            color="secondary"
          >
            キャンセル
          </Button>
          <Button
            onClick={() => {
              auth.remove_user(auth.get_current_user_id() || "");
              setIsLogoutAlertVisible(false);
            }}
            color="secondary"
          >
            ログアウト
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Account;
