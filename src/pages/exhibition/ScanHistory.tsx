import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  useTheme,
  Theme,
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { Login, Logout } from "components/MaterialSvgIcons";
import { AuthContext, useVerifyPermission } from "libs/auth";
import { useTitleSet } from "libs/title";
import { useWristBandPaletteColor } from "libs/wristBandColor";
import { getStringDateTime } from "libs/stringDate";
import api, { ActivityLog } from "@afes-website/docs";
import aspida from "@aspida/axios";
import PullToRefresh from "components/PullToRefresh";
import moment from "moment";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(1),
    },
    termColorBadge: {
      display: "inline-block",
      width: 14,
      height: 14,
      borderRadius: 7,
      marginBottom: -1,
      marginRight: theme.spacing(0.75),
    },
    loadingWrapper: {
      height: "calc(var(--100vh, 100vh) - 112px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  })
);

const ScanHistory: React.VFC = () => {
  useTitleSet("入退室スキャン履歴");
  useVerifyPermission("exhibition");

  const classes = useStyles();
  const auth = useContext(AuthContext).val;
  const wristBandPaletteColor = useWristBandPaletteColor();
  const theme = useTheme<Theme>();

  const [logs, setLogs] = useState<ActivityLog[] | null>(null);

  const load = useCallback(
    () =>
      api(aspida())
        .log.$get({
          headers: {
            Authorization: "bearer " + auth.get_current_user()?.token,
          },
          query: {
            exhibition_id: auth.get_current_user_id() || undefined,
          },
        })
        .then((res) => {
          setLogs(res);
        }),
    [auth]
  );

  useEffect(() => {
    load();
  }, [auth, load]);

  if (logs === null)
    return (
      <div className={classes.loadingWrapper}>
        <CircularProgress />
      </div>
    );

  return (
    <PullToRefresh onRefresh={load}>
      <div className={classes.root}>
        {logs.length > 0 && (
          <Typography align="center" variant="body2" color="textSecondary">
            履歴は新しい順に並んでいます。
          </Typography>
        )}
        <List>
          {logs
            .sort((a, b) => moment(b.timestamp).diff(a.timestamp)) // 新しいのが上
            .map((log) => (
              <ListItem key={log.id} divider>
                <ListItemIcon>
                  {log.log_type === "enter" ? <Login /> : <Logout />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography>
                      <span
                        className={classes.termColorBadge}
                        style={{
                          background: wristBandPaletteColor(
                            log.guest.term.guest_type
                          )[theme.palette.type === "light" ? "main" : "dark"],
                        }}
                      />
                      {log.guest.id}
                    </Typography>
                  }
                  secondary={getStringDateTime(log.timestamp)}
                />
              </ListItem>
            ))}
        </List>
        {logs.length > 0 ? (
          <Typography align="center" variant="body2" color="textSecondary">
            履歴は以上です。お疲れさまでした！
          </Typography>
        ) : (
          <Typography align="center" variant="body2" color="textSecondary">
            まだスキャン履歴はありません。
          </Typography>
        )}
      </div>
    </PullToRefresh>
  );
};
export default ScanHistory;
