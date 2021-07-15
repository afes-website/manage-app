import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { AccessTime, Assignment } from "@material-ui/icons";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { Login, Logout, WristBand } from "components/MaterialSvgIcons";
import CardList from "components/CardList";
import QRScanner from "components/QRScanner";
import ResultChip, { ResultChipRefs } from "components/ResultChip";
import DirectInputFab from "components/DirectInputFab";
import DirectInputModal from "components/DirectInputModal";
import { useAuth, useVerifyPermission } from "libs/auth";
import { useTitleSet } from "libs/title";
import isAxiosError from "libs/isAxiosError";
import { getStringDateTime, getStringDateTimeBrief } from "libs/stringDate";
import { useWristBandPaletteColor } from "libs/wristBandColor";
import { StatusColor } from "types/statusColor";
import api, {
  ActivityLog,
  AllStatus,
  Guest,
  Reservation,
} from "@afes-website/docs";
import aspida from "@aspida/axios";
import moment from "moment";
import clsx from "clsx";
import useErrorHandler from "libs/errorHandler";

const useStyles = makeStyles((theme) =>
  createStyles({
    tabs: {
      background: theme.palette.background.default,
      paddingTop: theme.spacing(1),
    },
    list: {
      marginBottom: theme.spacing(2) + 48,
    },
    resultChipBase: {
      position: "relative",
    },
    resultChip: {
      position: "absolute",
      bottom: theme.spacing(2) - 2,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10,
    },
    cardTitle: {
      paddingBottom: 0,
    },
    alertMessage: {
      display: "block",
    },
  })
);

const GuestInfo: React.VFC = () => {
  useTitleSet("来場者・予約情報照会");
  useVerifyPermission(["executive", "reservation"]);

  const classes = useStyles();
  const auth = useAuth();
  const resultChipRef = useRef<ResultChipRefs>(null);

  const [mode, setMode] = useState<"guest" | "rsv">(
    auth.get_current_user()?.permissions.executive ? "guest" : "rsv"
  );

  // guest
  const [guestId, setGuestId] = useState<string>("");
  const [guestInfo, setGuestInfo] = useState<Guest | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[] | null>(null);
  const [exhStatus, setExhStatus] = useState<AllStatus | null>(null);

  // reservation
  const [rsvId, setRsvId] = useState<string>("");
  const [rsvInfo, setRsvInfo] = useState<Reservation | null>(null);

  // 直接入力モーダルの開閉状態
  const [opensGuestInputModal, setOpensGuestInputModal] = useState(false);
  const [opensRsvInputModal, setOpensRsvInputModal] = useState(false);

  const [status, setStatus] = useState<StatusColor | null>(null);

  // エラー処理
  const [errorMessage, errorDialog, setErrorCode, setError] = useErrorHandler();

  const clearInfo = () => {
    // guest
    setGuestInfo(null);
    setActivityLogs(null);
    setExhStatus(null);

    // rsv
    setRsvInfo(null);
  };

  // モード切り替え時の初期化
  useEffect(() => {
    setGuestId("");
    setRsvId("");
    clearInfo();

    // error
    setStatus(null);
    setError(null);
    if (resultChipRef.current) resultChipRef.current.close();
  }, [mode, setError]);

  const handleScan = (value: string | null) => {
    if (value) {
      switch (mode) {
        case "guest":
          handleGuestIdScan(value);
          break;
        case "rsv":
          handleRsvIdScan(value);
          break;
      }
    }
  };

  const handleGuestIdScan = async (_guestId: string) => {
    if (_guestId !== guestId) {
      setGuestId(_guestId);
      setStatus("loading");
      try {
        const getGuestInfo = api(aspida())
          .guests._id(_guestId)
          .$get({
            headers: {
              Authorization: "bearer " + auth.get_current_user()?.token,
            },
          })
          .then((_info) => {
            setGuestInfo(_info);
          });
        const getActivityLog = api(aspida())
          .log.$get({
            headers: {
              Authorization: "bearer " + auth.get_current_user()?.token,
            },
            query: { guest_id: _guestId },
          })
          .then((_logs) => {
            setActivityLogs(_logs);
          });
        const getExhStatus = api(aspida())
          .exhibitions.$get({
            headers: {
              Authorization: "bearer " + auth.get_current_user()?.token,
            },
          })
          .then((_status) => {
            setExhStatus(_status);
          });
        await getGuestInfo;
        await getActivityLog;
        await getExhStatus;
        setStatus("success");
      } catch (e) {
        setStatus("error");
        if (isAxiosError(e) && e.response?.status === 404)
          setErrorCode("GUEST_NOT_FOUND");
        else setError(e);
      }
    }
  };

  const handleRsvIdScan = (_rsvId: string) => {
    if (_rsvId !== rsvId) {
      setRsvId(_rsvId);
      setStatus("loading");
      api(aspida())
        .reservations._id(_rsvId)
        .$get({
          headers: {
            Authorization: "bearer " + auth.get_current_user()?.token,
          },
        })
        .then((_rsvInfo) => {
          setStatus("success");
          setRsvInfo(_rsvInfo);
        })
        .catch((e) => {
          setStatus("error");
          if (isAxiosError(e) && e.response?.status === 404)
            setErrorCode("RESERVATION_NOT_FOUND");
          else setError(e);
        });
    }
  };

  useEffect(() => {
    const name = { guest: "ゲスト", rsv: "予約" };
    const id = { guest: guestId, rsv: rsvId };
    switch (status) {
      case "loading":
        clearInfo();
        setError(null);
        if (resultChipRef.current) resultChipRef.current.close();
        break;
      case "success":
        if (resultChipRef.current)
          resultChipRef.current.open(
            "success",
            `取得成功 / ${name[mode]} ID: ${id[mode]}`,
            3000
          );
        break;
      case "error":
        if (resultChipRef.current)
          resultChipRef.current.open(
            "error",
            `取得失敗 / ${name[mode]} ID: ${id[mode]}`
          );
        break;
    }
  }, [mode, status, guestId, rsvId, setError]);

  return (
    <>
      <Paper square className={classes.tabs}>
        <Tabs
          value={mode}
          onChange={(e, newValue: "guest" | "rsv") => {
            setMode(newValue);
          }}
          variant="fullWidth"
          color="secondary"
        >
          <Tab
            label="来場者 行動履歴一覧"
            value="guest"
            disabled={!auth.get_current_user()?.permissions.executive}
          />

          <Tab
            label="予約 登録情報一覧"
            value="rsv"
            disabled={!auth.get_current_user()?.permissions.reservation}
          />
        </Tabs>
      </Paper>
      <Grid container className={classes.list}>
        <Grid xs={12} md={6}>
          <CardList>
            <Card className={classes.resultChipBase}>
              <QRScanner
                onScanFunc={handleScan}
                videoStop={false}
                color={status || undefined}
              />
              {status && (
                <ResultChip
                  ref={resultChipRef}
                  className={classes.resultChip}
                />
              )}
            </Card>
            {status == "error" && (
              <Card>
                <Alert severity="error">
                  {errorDialog.open ? (
                    errorDialog.message.map((msg) => (
                      <span key={msg} className={classes.alertMessage}>
                        {msg}
                      </span>
                    ))
                  ) : (
                    <span className={classes.alertMessage}>{errorMessage}</span>
                  )}
                </Alert>
              </Card>
            )}
          </CardList>
        </Grid>
        <Grid xs={12} md={6}>
          <CardList>
            {mode === "guest" && (
              <>
                <Card>
                  <CardContent
                    className={clsx({
                      [classes.cardTitle]: guestId,
                    })}
                  >
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom={true}
                    >
                      ゲスト情報
                    </Typography>
                    {!guestId && (
                      <Typography variant="caption" align="center">
                        まだゲストQRコードをスキャンしていません。
                      </Typography>
                    )}
                  </CardContent>
                  {guestId && (
                    <GuestInfoList guestId={guestId} guest={guestInfo} />
                  )}
                </Card>
                <Card>
                  <CardContent
                    className={clsx({
                      [classes.cardTitle]: activityLogs && exhStatus,
                    })}
                  >
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom={true}
                    >
                      行動履歴一覧
                    </Typography>
                    {!guestId ? (
                      <Typography variant="caption" align="center">
                        まだゲストQRコードをスキャンしていません。
                      </Typography>
                    ) : (
                      !activityLogs && (
                        <Typography variant="caption" align="center">
                          まだゲストQRコードをスキャンしていません。
                        </Typography>
                      )
                    )}
                    {activityLogs?.length === 0 && (
                      <Typography variant="caption" align="center">
                        展示への入退出記録がありません。
                      </Typography>
                    )}
                  </CardContent>
                  {activityLogs && exhStatus && activityLogs.length > 0 && (
                    <LogList logs={activityLogs} status={exhStatus} />
                  )}
                </Card>
              </>
            )}
            {mode === "rsv" && (
              <Card>
                <CardContent
                  className={clsx({
                    [classes.cardTitle]: rsvId,
                  })}
                >
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom={true}
                  >
                    予約情報
                  </Typography>
                  {!rsvId && (
                    <Typography variant="caption" align="center">
                      まだ予約QRコードをスキャンしていません。
                    </Typography>
                  )}
                </CardContent>
                {rsvId && <PrivateInfoList rsvId={rsvId} info={rsvInfo} />}
              </Card>
            )}
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              gutterBottom={true}
            >
              情報の取り扱いには十分注意してください。
            </Typography>
          </CardList>
        </Grid>
      </Grid>

      {/* 直接入力ボタン */}
      <DirectInputFab
        onClick={() => {
          ({ guest: setOpensGuestInputModal, rsv: setOpensRsvInputModal }[mode](
            true
          ));
        }}
        disabled={status === "loading"}
      />

      {/* 直接入力モーダル */}
      <DirectInputModal
        open={opensGuestInputModal}
        setOpen={setOpensGuestInputModal}
        onIdChange={handleGuestIdScan}
        currentId={guestId}
        type="guest"
      />
      <DirectInputModal
        open={opensRsvInputModal}
        setOpen={setOpensRsvInputModal}
        onIdChange={handleRsvIdScan}
        currentId={rsvId}
        type="rsv"
      />
    </>
  );
};

export default GuestInfo;

const useComponentsStyles = makeStyles((theme) =>
  createStyles({
    termColorBadge: {
      display: "inline-block",
      width: 12,
      height: 12,
      borderRadius: 6,
      marginBottom: -1,
      marginRight: theme.spacing(0.75),
    },
  })
);

const GuestInfoList: React.VFC<{ guestId: string; guest: Guest | null }> = ({
  guestId,
  guest,
}) => {
  const classes = useComponentsStyles();
  const wristBandPaletteColor = useWristBandPaletteColor();

  return (
    <List>
      <ListItem>
        <ListItemIcon>
          <WristBand />
        </ListItemIcon>
        <ListItemText
          primary={
            <>
              {guest && (
                <span
                  className={classes.termColorBadge}
                  style={{
                    background: wristBandPaletteColor(guest.term.guest_type)
                      .main,
                  }}
                />
              )}
              {guestId}
            </>
          }
          secondary="ゲスト ID"
        />
      </ListItem>
      {guest && (
        <>
          <Grid container spacing={0}>
            <Grid item xs={6}>
              <ListItem>
                <ListItemIcon>
                  <Login />
                </ListItemIcon>
                <ListItemText
                  primary={getStringDateTimeBrief(guest.entered_at)}
                  secondary="入場時刻"
                />
              </ListItem>
            </Grid>
            <Grid item xs={6}>
              <ListItem>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText
                  primary={
                    guest.exited_at
                      ? getStringDateTimeBrief(guest.exited_at)
                      : "-"
                  }
                  secondary="退場時刻"
                />
              </ListItem>
            </Grid>
          </Grid>
          <Grid container spacing={0}>
            <Grid item xs={6}>
              <ListItem>
                <ListItemIcon>
                  <AccessTime />
                </ListItemIcon>
                <ListItemText
                  primary={
                    guest.term.enter_scheduled_time
                      ? getStringDateTimeBrief(guest.term.enter_scheduled_time)
                      : "-"
                  }
                  secondary="入場予定時刻"
                />
              </ListItem>
            </Grid>
            <Grid item xs={6}>
              <ListItem>
                <ListItemIcon>
                  <AccessTime />
                </ListItemIcon>
                <ListItemText
                  primary={
                    guest.term.exit_scheduled_time
                      ? getStringDateTimeBrief(guest.term.exit_scheduled_time)
                      : "-"
                  }
                  secondary="退場予定時刻"
                />
              </ListItem>
            </Grid>
          </Grid>
        </>
      )}
    </List>
  );
};

const LogList: React.VFC<{ logs: ActivityLog[]; status: AllStatus }> = ({
  logs,
  status,
}) => (
  <List>
    {logs
      .sort((a, b) => moment(b.timestamp).diff(a.timestamp)) // 新しいのが上
      .map((log) => (
        <ListItem key={log.id}>
          <ListItemIcon>
            {log.log_type === "enter" ? <Login /> : <Logout />}
          </ListItemIcon>
          <ListItemText
            primary={`${
              status.exhibition[log.exhibition_id]?.info.name || "-"
            } ${log.log_type === "enter" ? "入室" : "退室"}`}
            secondary={getStringDateTime(log.timestamp)}
          />
        </ListItem>
      ))}
  </List>
);

const PrivateInfoList: React.VFC<{
  rsvId: string;
  info: Reservation | null;
}> = ({ rsvId, info }) => {
  const classes = useComponentsStyles();
  const wristBandPaletteColor = useWristBandPaletteColor();

  return (
    <List>
      <ListItem>
        <ListItemIcon>
          <Assignment />
        </ListItemIcon>
        <ListItemText primary={rsvId} secondary="予約 ID" />
      </ListItem>
      {info && (
        <ListItem>
          <ListItemIcon>
            <AccessTime />
          </ListItemIcon>
          <ListItemText
            primary={
              <>
                <span
                  className={classes.termColorBadge}
                  style={{
                    background: wristBandPaletteColor(info.term.guest_type)
                      .main,
                  }}
                />
                {`${getStringDateTimeBrief(
                  info.term.enter_scheduled_time
                )} - ${getStringDateTimeBrief(info.term.exit_scheduled_time)}`}
              </>
            }
            secondary="予約時間帯"
          />
        </ListItem>
      )}
    </List>
  );
};
