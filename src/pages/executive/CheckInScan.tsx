import React, { useState, useContext, useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import {
  AccessTime,
  Assignment,
  CheckCircle,
  Replay,
} from "@material-ui/icons";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { WristBand } from "components/MaterialSvgIcons";
import CardList from "components/CardList";
import QRScanner from "components/QRScanner";
import DirectInputModal from "components/DirectInputModal";
import DirectInputFab from "components/DirectInputFab";
import ResultChip, { ResultChipRefs } from "components/ResultChip";
import ResultPopup, { ResultPopupRefs } from "components/ResultPopup";
import ErrorDialog from "components/ErrorDialog";
import { useTitleSet } from "libs/title";
import { AuthContext, useVerifyPermission } from "libs/auth";
import isAxiosError from "libs/isAxiosError";
import { getStringDateTimeBrief, getStringTime } from "libs/stringDate";
import { useWristBandPaletteColor } from "libs/wristBandColor";
import { StatusColor } from "types/statusColor";
import api, { Guest, Reservation, Term } from "@afes-website/docs";
import aspida from "@aspida/axios";
import clsx from "clsx";

const useStyles = makeStyles((theme) =>
  createStyles({
    list: {
      marginBottom: theme.spacing(2) + 48,
    },
    noPadding: {
      padding: "0 !important",
      objectFit: "cover",
    },
    bottomButton: {
      width: "100%",
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
    progressWrapper: {
      position: "relative",
    },
    progress: {
      position: "absolute",
      top: -6,
      left: -6,
      zIndex: 10,
    },
    successIcon: {
      color: theme.palette.success.main,
    },
    previousGuestInfoTitle: {
      paddingBottom: 0,
    },
    countLimit: {
      marginLeft: 4,
    },
  })
);

const CheckInScan: React.VFC = () => {
  useTitleSet("文化祭 入場スキャン");
  useVerifyPermission("executive");
  const classes = useStyles();
  const auth = useContext(AuthContext).val;
  const resultPopupRef = useRef<ResultPopupRefs>(null);
  const resultChipRef = useRef<ResultChipRefs>(null);

  // ==== state ====

  // 最後に読み込んだ予約ID・ゲストID
  const [latestRsvId, setLatestRsvId] = useState("");
  const [latestRsv, setLatestRsv] = useState<Reservation | null>(null);
  const [latestGuestId, setLatestGuestId] = useState("");
  // 直接入力モーダルの開閉状態
  const [opensRsvInputModal, setOpensRsvInputModal] = useState(false);
  const [opensGuestInputModal, setOpensGuestInputModal] = useState(false);
  // ステップ管理
  const [activeScanner, setActiveScanner] = useState<"rsv" | "guest">("rsv");
  // 最新のAPI通信で発生したエラーコード
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  // 前回入場したゲスト情報
  const [prevGuestInfo, setPrevGuestInfo] = useState<Guest | null>(null);
  // 予約ID・ゲストIDそれぞれのチェック結果
  const [rsvCheckStatus, setRsvCheckStatus] = useState<StatusColor | null>(
    null
  );
  const [guestCheckStatus, setGuestCheckStatus] = useState<StatusColor | null>(
    null
  );
  // 予約IDチェック・ゲストIDチェックをマージした全体のチェック結果
  // useEffect で自動更新
  const [totalCheckStatus, setTotalCheckStatus] = useState<StatusColor | null>(
    null
  );
  // エラーダイアログ
  const [errorDialogTitle, setErrorDialogTitle] = useState("");
  const [errorDialogMessage, setErrorDialogMessage] = useState<string[]>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // 全体のチェック結果の更新処理
  useEffect(() => {
    if (rsvCheckStatus === "success" && guestCheckStatus === "success")
      setTotalCheckStatus("success");
    else if (rsvCheckStatus === "loading" || guestCheckStatus === "loading")
      setTotalCheckStatus("loading");
    else if (rsvCheckStatus === "error" || guestCheckStatus === "error")
      setTotalCheckStatus("error");
    else setTotalCheckStatus(null);
  }, [rsvCheckStatus, guestCheckStatus]);

  // 全リセット
  const clearAll = () => {
    setLatestRsvId("");
    setLatestRsv(null);
    setLatestGuestId("");
    setOpensRsvInputModal(false);
    setOpensGuestInputModal(false);
    setActiveScanner("rsv");
    setErrorCode(null);
    setRsvCheckStatus(null);
    setGuestCheckStatus(null);
    if (resultChipRef.current) resultChipRef.current.close();
  };

  const handleScan = (data: string | null) => {
    if (data)
      switch (activeScanner) {
        case "rsv":
          if (
            data !== latestRsvId &&
            (rsvCheckStatus === null || rsvCheckStatus === "error")
          )
            handleRsvIdScan(data);
          break;
        case "guest":
          if (
            data !== latestRsvId &&
            data !== latestGuestId &&
            (guestCheckStatus === null || guestCheckStatus === "error")
          )
            handleGuestIdScan(data);
          break;
      }
  };

  const handleRsvIdScan = (rsvId: string) => {
    setLatestRsvId(rsvId);
    setRsvCheckStatus("loading");
    api(aspida())
      .reservations._id(rsvId)
      .check.$get({
        headers: {
          Authorization: "bearer " + auth.get_current_user()?.token,
        },
      })
      .then((res) => {
        setLatestRsv(res.reservation);

        if (res.valid) {
          setRsvCheckStatus("success");
        } else if (
          res.error_code &&
          (errorCodeList as ReadonlyArray<string>).includes(res.error_code)
        ) {
          setRsvCheckStatus("error");
          setErrorCode(res.error_code as ErrorCode);
        }
      })
      .catch((e) => {
        setRsvCheckStatus("error");

        if (isAxiosError(e) && e.response?.status === 404)
          setErrorCode("RESERVATION_NOT_FOUND");
        else networkErrorHandler(e);
      });
  };

  useEffect(() => {
    switch (rsvCheckStatus) {
      case "loading":
        setErrorCode(null);
        setLatestRsv(null);
        if (resultChipRef.current) resultChipRef.current.close();
        break;
      case "success":
        setTimeout(() => {
          setActiveScanner("guest");
        }, 500);
        if (resultChipRef.current)
          resultChipRef.current.open(
            "success",
            `予約確認成功 / 予約 ID: ${latestRsvId}`,
            3000
          );
        break;
      case "error":
        if (resultChipRef.current)
          resultChipRef.current.open(
            "error",
            `予約確認失敗 / 予約 ID: ${latestRsvId}`
          );
        break;
    }
  }, [rsvCheckStatus, latestRsvId]);

  const handleGuestIdScan = (guestId: string) => {
    setLatestGuestId(guestId);
    setGuestCheckStatus("loading");
    // guest id 検証 (rsv id は有効性を確認済)
    api(aspida())
      .guests.check_in.$post({
        body: {
          reservation_id: latestRsvId,
          guest_id: guestId,
        },
        headers: {
          Authorization: "bearer " + auth.get_current_user()?.token,
        },
      })
      .then((guest) => {
        setGuestCheckStatus("success");
        setPrevGuestInfo(guest);
      })
      .catch((e) => {
        setGuestCheckStatus("error");
        if (isAxiosError(e)) {
          const errorCode: unknown = e.response?.data.error_code;
          if (
            typeof errorCode === "string" &&
            (errorCodeList as ReadonlyArray<string>).includes(errorCode)
          ) {
            setErrorCode(errorCode as ErrorCode);
            return;
          }
        }
        networkErrorHandler(e);
      });
  };

  const handleSuccess = () => {
    if (latestRsv && latestRsv.member_checked_in + 1 < latestRsv.member_all) {
      handleRsvIdScan(latestRsvId);
      setGuestCheckStatus(null);
      setLatestGuestId("");
      return;
    }
    clearAll();
  };

  useEffect(() => {
    switch (guestCheckStatus) {
      case "loading":
        setErrorCode(null);
        if (resultChipRef.current) resultChipRef.current.close();
        if (resultPopupRef.current) resultPopupRef.current.open();
        break;
      case "success":
        if (resultChipRef.current)
          resultChipRef.current.open(
            "success",
            `入場成功 / ゲスト ID: ${latestGuestId}`
          );
        break;
      case "error":
        if (resultChipRef.current)
          resultChipRef.current.open(
            "error",
            `入場失敗 / ゲスト ID: ${latestGuestId}`
          );
        break;
    }
  }, [guestCheckStatus, latestGuestId]);

  const networkErrorHandler = (e: unknown): void => {
    console.error(e);
    setErrorDialogOpen(true);
    if (isAxiosError(e)) {
      // axios error
      if (e.response?.status) {
        // status code があるとき
        setErrorCode("SERVER_ERROR");
        setErrorDialogTitle("サーバーエラー");
        setErrorDialogMessage([
          "サーバーエラーが発生しました。",
          "総務局にお問い合わせください。",
          `status code: ${e.response?.status || "undefined"}`,
          e.message,
        ]);
      }
      // ないとき
      else {
        setErrorCode("NETWORK_ERROR");
        setErrorDialogTitle("通信エラー");
        setErrorDialogMessage([
          "通信エラーが発生しました。",
          "通信環境を確認し、はじめからやり直してください。",
          "状況が改善しない場合は、総務局にお問い合わせください。",
          e.message,
        ]);
      }
    }
    // なにもわからないとき
    else {
      setErrorCode("NETWORK_ERROR");
      setErrorDialogTitle("通信エラー");
      setErrorDialogMessage([
        "通信エラーが発生しました。",
        "通信環境を確認し、はじめからやり直してください。",
        "状況が改善しない場合は、総務局にお問い合わせください。",
      ]);
    }
  };

  return (
    <div>
      <CardList className={classes.list}>
        {/* QR Scanner */}
        <Card>
          <CardContent
            className={clsx(classes.noPadding, classes.resultChipBase)}
          >
            <QRScanner
              onScanFunc={handleScan}
              videoStop={false}
              color={
                { rsv: rsvCheckStatus, guest: guestCheckStatus }[
                  activeScanner
                ] ?? undefined
              }
            />
            {/* Result Chip */}
            <ResultChip ref={resultChipRef} className={classes.resultChip} />
          </CardContent>
        </Card>

        {/* Error Alert */}
        {errorCode && (
          <Card>
            <CardContent className={classes.noPadding}>
              <Alert severity="error">{getErrorMessage(errorCode)}</Alert>
            </CardContent>
          </Card>
        )}

        {/* ID List */}
        <Card>
          <CardContent className={classes.noPadding}>
            <List>
              <ListItem disabled={activeScanner !== "rsv"}>
                <ListItemIcon className={classes.progressWrapper}>
                  {rsvCheckStatus === "success" ? (
                    <CheckCircle className={classes.successIcon} />
                  ) : (
                    <Assignment />
                  )}
                  {rsvCheckStatus === "loading" && (
                    <CircularProgress className={classes.progress} size={36} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={latestRsvId ? latestRsvId : "-"}
                  secondary={
                    <>
                      予約 ID
                      {latestRsv && (
                        <>
                          {" • "}
                          <ReservationTermInfo term={latestRsv.term} />
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
              <ListItem disabled={activeScanner !== "guest"}>
                <ListItemIcon>
                  <WristBand />
                </ListItemIcon>
                <ListItemText
                  primary={latestGuestId ? latestGuestId : "-"}
                  secondary="ゲスト ID (リストバンド)"
                />
                {latestRsv && (
                  <ListItemSecondaryAction>
                    <Typography display="inline">
                      {`${latestRsv.member_checked_in + 1}人目`}
                    </Typography>
                    <Typography
                      display="inline"
                      variant="caption"
                      className={classes.countLimit}
                    >
                      {`/${latestRsv.member_all}人`}
                    </Typography>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* はじめからやり直すボタン */}
        {(activeScanner !== "rsv" || totalCheckStatus === "error") && (
          <Button
            variant="contained"
            color="primary"
            className={classes.bottomButton}
            startIcon={<Replay />}
            onClick={clearAll}
          >
            はじめからやり直す
          </Button>
        )}

        {/* 前回入場したゲスト情報 */}
        {activeScanner === "rsv" && ["loading", null].includes(rsvCheckStatus) && (
          <Card>
            <CardContent
              className={clsx({
                [classes.previousGuestInfoTitle]: prevGuestInfo,
              })}
            >
              <Typography
                style={{ fontSize: 14 }}
                color="textSecondary"
                gutterBottom={true}
              >
                前回入場したゲスト情報
              </Typography>
              {!prevGuestInfo && (
                <Typography variant="caption" align="center">
                  まだゲストの文化祭入場処理をしていません。
                </Typography>
              )}
            </CardContent>
            {prevGuestInfo && <GuestInfoList guest={prevGuestInfo} />}
          </Card>
        )}
      </CardList>

      {/* 結果表示ポップアップ */}
      <ResultPopup
        status={totalCheckStatus}
        duration={2000}
        handleCloseOnSuccess={handleSuccess}
        ref={resultPopupRef}
      />

      {/* 直接入力ボタン */}
      <DirectInputFab
        onClick={() => {
          ({ rsv: setOpensRsvInputModal, guest: setOpensGuestInputModal }[
            activeScanner
          ](true));
        }}
        disabled={
          { rsv: rsvCheckStatus, guest: guestCheckStatus }[activeScanner] ===
          "loading"
        }
      />

      {/* 直接入力モーダル */}
      <DirectInputModal
        open={opensRsvInputModal}
        setOpen={setOpensRsvInputModal}
        onIdChange={handleRsvIdScan}
        currentId={latestRsvId}
        type="rsv"
      />
      <DirectInputModal
        open={opensGuestInputModal}
        setOpen={setOpensGuestInputModal}
        onIdChange={handleGuestIdScan}
        currentId={latestGuestId}
        type="guest"
      />

      {/* エラーダイアログ */}
      <ErrorDialog
        open={errorDialogOpen}
        title={errorDialogTitle}
        message={errorDialogMessage}
        onClose={() => {
          setErrorDialogOpen(false);
        }}
      />
    </div>
  );
};

const GuestInfoList: React.VFC<{ guest: Guest }> = (props) => (
  <List>
    <ListItem>
      <ListItemIcon>
        <WristBand />
      </ListItemIcon>
      <ListItemText primary={props.guest.id} secondary="ゲスト ID" />
    </ListItem>
    <Grid container spacing={0}>
      <Grid item xs={6}>
        <ListItem>
          <ListItemIcon>
            <AccessTime />
          </ListItemIcon>
          <ListItemText
            primary={getStringDateTimeBrief(props.guest.entered_at)}
            secondary="入場時刻"
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
              props.guest.term.exit_scheduled_time
                ? getStringDateTimeBrief(props.guest.term.exit_scheduled_time)
                : "-"
            }
            secondary="退場予定時刻"
          />
        </ListItem>
      </Grid>
    </Grid>
  </List>
);

const ReservationTermInfo: React.VFC<{ term: Term }> = (props) => {
  const wristBandColor = useWristBandPaletteColor();
  return (
    <span style={{ color: wristBandColor(props.term.guest_type).main }}>
      {props.term.guest_type + " "}
      {`(${getStringDateTimeBrief(props.term.enter_scheduled_time)}
      -
      ${getStringTime(props.term.exit_scheduled_time)})`}
    </span>
  );
};

const getErrorMessage = (error_code: ErrorCode): string => {
  switch (error_code) {
    // reservation
    case "RESERVATION_NOT_FOUND":
      return "合致する予約情報がありません。マニュアルを参照し、権限の強い人を呼んでください。";
    case "INVALID_RESERVATION_INFO":
      return "予約情報に不備があります。権限の強い人を呼んでください。";
    case "OUT_OF_RESERVATION_TIME":
      return "入場可能時間外です。マニュアルを参照してください。";
    case "ALL_MEMBER_CHECKED_IN":
      return "すでに予約人数全員の入場処理が完了しています。権限の強い人を呼んでください。";
    // guest (wristband)
    case "INVALID_WRISTBAND_CODE":
      return "リストバンド ID の形式が間違っています。予約 QR を読んでいませんか？";
    case "ALREADY_USED_WRISTBAND":
      return "使用済みのリストバンドです。権限の強い人を呼んでください。";
    case "WRONG_WRISTBAND_COLOR":
      return "リストバンドの種類が間違っています。";
    case "NETWORK_ERROR":
      return "通信エラーが発生しました。通信環境を確認し、はじめからやり直してください。状況が改善しない場合は、総務局にお問い合わせください。";
    case "SERVER_ERROR":
      return "サーバーエラーが発生しました。至急、総務局にお問い合わせください。";
  }
};

const errorCodeList = [
  "INVALID_WRISTBAND_CODE",
  "ALREADY_USED_WRISTBAND",
  "RESERVATION_NOT_FOUND",
  "INVALID_RESERVATION_INFO",
  "ALL_MEMBER_CHECKED_IN",
  "OUT_OF_RESERVATION_TIME",
  "WRONG_WRISTBAND_COLOR",
  "NETWORK_ERROR",
  "SERVER_ERROR",
] as const;

type ErrorCode = typeof errorCodeList[number];

export default CheckInScan;
