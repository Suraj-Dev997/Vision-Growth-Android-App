import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import {
  AGE_MAX,
  AGE_MIN,
  AL_MAX,
  AL_MIN,
  SE_MAX,
  SE_MIN,
  VA_LOGMAR_MAX,
  VA_LOGMAR_MIN,
  VA_LOGMAR_TABLE,
  formatVaLogmarLabel,
  rangeTicks,
  snellenToLogmar,
  thinTicks,
} from '../constants/clinicalCharts';
import { colors } from '../theme/colors';
import { contentWidth as resolveContentWidth } from '../utils/layout';

export type Point = {
  label: string;
  age?: number | string | null;
  od?: number | string | null;
  os?: number | string | null;
};

export type ChartKind = 'va' | 'se' | 'al' | 'auto';

/** SE/AL → number; VA Snellen → LogMAR (official table). */
function toPlotValue(v: any, kind: ChartKind): number | null {
  if (v == null || v === '') return null;
  if (kind === 'va') return snellenToLogmar(v);
  const s = String(v).trim();
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Fixed scales matching Growth Card PDF (R7):
 * VA LogMAR 1.00→−0.30 (worse at top), SE +1→−5, AL 20→30, Age 2→18.
 */
function scaleFor(kind: ChartKind, _vals: number[], ages: number[]) {
  let yMin: number;
  let yMax: number;
  let yTicks: number[];
  let yLabel: (v: number) => string;
  /** false = higher value at top (same as PDF printed graphs) */
  let invertY = false;

  if (kind === 'va') {
    yMin = VA_LOGMAR_MIN;
    yMax = VA_LOGMAR_MAX;
    // Full table, thinned for readable labels (keep ends)
    const all = [...VA_LOGMAR_TABLE].map(r => r.logmar).sort((a, b) => b - a);
    yTicks = thinTicks(all, 8);
    yLabel = (v: number) => formatVaLogmarLabel(v);
    invertY = false;
  } else if (kind === 'se') {
    yMin = SE_MIN;
    yMax = SE_MAX;
    // Label every 1.00 D (PDF has 0.25 grid; app shows major ticks)
    yTicks = rangeTicks(SE_MIN, SE_MAX, 1).reverse();
    yLabel = (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));
    invertY = false;
  } else if (kind === 'al') {
    yMin = AL_MIN;
    yMax = AL_MAX;
    yTicks = rangeTicks(AL_MIN, AL_MAX, 2).reverse(); // 30…20 like PDF major marks
    yLabel = (v: number) => v.toFixed(0);
    invertY = false;
  } else {
    yMin = 0;
    yMax = 1;
    yTicks = [0, 0.5, 1];
    yLabel = (v: number) => v.toFixed(2);
  }

  // Always use PDF age axis (2–18) for clinical graphs
  const useFixedAge = kind === 'va' || kind === 'se' || kind === 'al' || ages.length > 0;
  const xMin = AGE_MIN;
  const xMax = AGE_MAX;
  const xTicks = useFixedAge ? rangeTicks(AGE_MIN, AGE_MAX, 2) : [];
  const xTitle = useFixedAge ? 'Age (Years)' : '';

  return {
    yMin,
    yMax,
    yTicks,
    yLabel,
    invertY,
    yTitle:
      kind === 'va'
        ? 'VA (LogMAR)'
        : kind === 'se'
          ? 'SE (D)'
          : kind === 'al'
            ? 'AL (mm)'
            : '',
    xMin,
    xMax,
    xTicks,
    xTitle,
    useFixedAge,
  };
}

function ChartSvg({
  points,
  width,
  height,
  kind = 'auto',
  showFullAxes = true,
}: {
  points: Point[];
  width: number;
  height: number;
  kind?: ChartKind;
  showFullAxes?: boolean;
}) {
  const pad = {
    // VA labels like "6/4.8 (-0.10)" need extra left room
    l: showFullAxes ? (kind === 'va' ? 78 : kind === 'se' ? 44 : 40) : 36,
    r: kind === 'va' ? 56 : 40,
    t: showFullAxes ? 18 : 12,
    b: showFullAxes ? 34 : 26,
  };
  const plotW = Math.max(width - pad.l - pad.r, 10);
  const plotH = Math.max(height - pad.t - pad.b, 10);

  const model = useMemo(() => {
    const vals: number[] = [];
    points.forEach(p => {
      const od = toPlotValue(p.od, kind);
      const os = toPlotValue(p.os, kind);
      if (od != null) vals.push(od);
      if (os != null) vals.push(os);
    });
    if (!vals.length) return null;

    const ages = points
      .map(p => Number(p.age))
      .filter(a => Number.isFinite(a) && a > 0) as number[];
    const scale = scaleFor(kind, vals, ages);
    const useAge = !!scale.useFixedAge;

    const mapY = (v: number) => {
      const span = scale.yMax - scale.yMin || 1;
      // invertY true → lower at top; false → higher at top (PDF match)
      const t = scale.invertY ? (v - scale.yMin) / span : (scale.yMax - v) / span;
      return pad.t + t * plotH;
    };

    const mapX = (i: number, p: Point) => {
      if (useAge) {
        const age = Number(p.age);
        const a = Number.isFinite(age) ? age : scale.xMin;
        const clamped = Math.min(scale.xMax, Math.max(scale.xMin, a));
        return pad.l + ((clamped - scale.xMin) / (scale.xMax - scale.xMin || 1)) * plotW;
      }
      const n = Math.max(points.length - 1, 1);
      return pad.l + (i / n) * plotW;
    };

    const odPts = points
      .map((p, i) => {
        const v = toPlotValue(p.od, kind);
        return v == null ? null : `${mapX(i, p)},${mapY(v)}`;
      })
      .filter(Boolean) as string[];
    const osPts = points
      .map((p, i) => {
        const v = toPlotValue(p.os, kind);
        return v == null ? null : `${mapX(i, p)},${mapY(v)}`;
      })
      .filter(Boolean) as string[];

    return { odPts, osPts, mapX, mapY, scale, useAge };
  }, [points, plotH, plotW, kind, pad.l, pad.t]);

  if (!model) {
    return (
      <View style={{ height, justifyContent: 'center' }}>
        <Text style={styles.empty}>Enter OD / OS values to generate graph</Text>
      </View>
    );
  }

  const { scale, useAge } = model;

  return (
    <Svg width={width} height={height}>
      {/* Y grid + numbers */}
      {scale.yTicks.map((tick, i) => {
        const y = model.mapY(tick);
        return (
          <React.Fragment key={`y-${i}`}>
            <Line
              x1={pad.l}
              y1={y}
              x2={width - pad.r}
              y2={y}
              stroke={colors.line}
              strokeWidth={1}
              strokeDasharray={tick === 0 ? undefined : '4 3'}
            />
            <SvgText
              x={pad.l - 6}
              y={y + 3}
              fontSize={kind === 'va' ? '7' : '8'}
              fill={colors.muted}
              textAnchor="end"
              fontWeight="600">
              {scale.yLabel(tick)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Axes */}
      <Line x1={pad.l} y1={pad.t} x2={pad.l} y2={height - pad.b} stroke={colors.line} strokeWidth={1.2} />
      <Line
        x1={pad.l}
        y1={height - pad.b}
        x2={width - pad.r}
        y2={height - pad.b}
        stroke={colors.line}
        strokeWidth={1.2}
      />

      {showFullAxes && !!scale.yTitle && (
        <SvgText x={pad.l} y={12} fontSize="9" fill={colors.navy} fontWeight="700">
          {scale.yTitle}
        </SvgText>
      )}

      {model.odPts.length > 1 && (
        <Polyline points={model.odPts.join(' ')} fill="none" stroke={colors.od} strokeWidth={2.5} />
      )}
      {model.osPts.length > 1 && (
        <Polyline points={model.osPts.join(' ')} fill="none" stroke={colors.os} strokeWidth={2.5} />
      )}

      {points.map((p, i) => {
        const od = toPlotValue(p.od, kind);
        const os = toPlotValue(p.os, kind);
        const x = model.mapX(i, p);
        const odY = od != null ? model.mapY(od) : 0;
        const osY = os != null ? model.mapY(os) : 0;
        // VA: "6/6 (0.00)"; SE/AL: typed values
        const odText =
          kind === 'va' && od != null
            ? formatVaLogmarLabel(od)
            : p.od != null && String(p.od).trim()
              ? String(p.od)
              : od != null
                ? String(od)
                : '';
        const osText =
          kind === 'va' && os != null
            ? formatVaLogmarLabel(os)
            : p.os != null && String(p.os).trim()
              ? String(p.os)
              : os != null
                ? String(os)
                : '';
        // Keep OD above / OS below; nudge if both are very close
        const close = od != null && os != null && Math.abs(odY - osY) < 16;
        const odLabelY = odY - (close ? 10 : 6);
        const osLabelY = osY + (close ? 14 : 12);
        const labelX = Math.min(x + 8, width - pad.r + 4);
        return (
          <React.Fragment key={i}>
            {od != null && (
              <>
                <Circle cx={x} cy={odY} r={4} fill={colors.od} />
                <SvgText
                  x={labelX}
                  y={odLabelY}
                  fontSize={kind === 'va' ? '7' : '8'}
                  fill={colors.od}
                  fontWeight="700">
                  {odText}
                </SvgText>
              </>
            )}
            {os != null && (
              <>
                <Rect x={x - 3.5} y={osY - 3.5} width={7} height={7} fill={colors.os} />
                <SvgText
                  x={labelX}
                  y={osLabelY}
                  fontSize={kind === 'va' ? '7' : '8'}
                  fill={colors.os}
                  fontWeight="700">
                  {osText}
                </SvgText>
              </>
            )}
          </React.Fragment>
        );
      })}

      {/* X labels / numbers */}
      {useAge && scale.xTicks.length
        ? scale.xTicks.map(age => {
            const x = pad.l + ((age - scale.xMin) / (scale.xMax - scale.xMin || 1)) * plotW;
            return (
              <SvgText
                key={`x-${age}`}
                x={x}
                y={height - 8}
                fontSize="8"
                fill={colors.muted}
                textAnchor="middle"
                fontWeight="600">
                {String(age)}
              </SvgText>
            );
          })
        : points.map((p, i) => (
            <SvgText
              key={`xl-${i}`}
              x={model.mapX(i, p)}
              y={height - 8}
              fontSize="8"
              fill={colors.muted}
              textAnchor="middle"
              fontWeight="600">
              {p.label}
            </SvgText>
          ))}

      {showFullAxes && useAge && !!scale.xTitle && (
        <SvgText
          x={pad.l + plotW / 2}
          y={height - 1}
          fontSize="8"
          fill={colors.navy}
          textAnchor="middle"
          fontWeight="700">
          {scale.xTitle}
        </SvgText>
      )}
    </Svg>
  );
}

/** Full-width chart card — tap opens full screen */
export function OdOsChart({
  title,
  points,
  height = 160,
  kind = 'auto',
}: {
  title: string;
  points: Point[];
  height?: number;
  kind?: ChartKind;
}) {
  const [open, setOpen] = useState(false);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardW = resolveContentWidth(screenW, screenH) - 32;

  return (
    <>
      <Pressable style={styles.card} onPress={() => setOpen(true)}>
        <View style={styles.cardHead}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.odOsTag}>OD / OS</Text>
        </View>
        <Text style={styles.tapHint}>Tap for full screen</Text>
        <View style={styles.legend}>
          <View style={styles.legItem}>
            <View style={[styles.dot, { backgroundColor: colors.od }]} />
            <Text style={[styles.legText, { color: colors.od }]}>Right Eye (OD)</Text>
          </View>
          <View style={styles.legItem}>
            <View style={[styles.sq, { backgroundColor: colors.os }]} />
            <Text style={[styles.legText, { color: colors.os }]}>Left Eye (OS)</Text>
          </View>
        </View>
        <ChartSvg points={points} width={cardW - 20} height={height} kind={kind} showFullAxes />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Pressable onPress={() => setOpen(false)}>
            <Text style={styles.close}>← Close</Text>
          </Pressable>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <View style={styles.legendCol}>
            <View style={styles.legItem}>
              <View style={[styles.dot, { backgroundColor: colors.od }]} />
              <Text style={[styles.legText, { color: colors.od }]}>Right Eye (OD)</Text>
            </View>
            <View style={styles.legItem}>
              <View style={[styles.sq, { backgroundColor: colors.os }]} />
              <Text style={[styles.legText, { color: colors.os }]}>Left Eye (OS)</Text>
            </View>
          </View>
          <ChartSvg
            points={points}
            width={screenW - 24}
            height={420}
            kind={kind}
            showFullAxes
          />
        </View>
      </Modal>
    </>
  );
}

/** VA / SE / AL stacked — each with numbered axes */
export function GraphStrip({
  vaPts,
  sePts,
  alPts,
}: {
  vaPts: Point[];
  sePts: Point[];
  alPts: Point[];
}) {
  return (
    <View style={styles.strip}>
      <OdOsChart title="Vision (VA)" points={vaPts} height={170} kind="va" />
      <OdOsChart
        title="Refraction under Cycloplegia (SE)"
        points={sePts}
        height={190}
        kind="se"
      />
      <OdOsChart title="Axial Length (AL)" points={alPts} height={170} kind="al" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
    width: '100%',
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontWeight: '800', color: colors.navy, fontSize: 14, flex: 1 },
  odOsTag: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', fontSize: 12 },
  legend: { flexDirection: 'row', gap: 14, marginBottom: 4, marginTop: 2 },
  legendCol: { gap: 6, marginBottom: 10 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sq: { width: 8, height: 8, borderRadius: 1 },
  legText: { fontSize: 11, fontWeight: '700' },
  tapHint: { color: colors.primary, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  strip: { flexDirection: 'column', width: '100%', marginBottom: 4 },
  modal: { flex: 1, backgroundColor: colors.bg, paddingTop: 52, paddingHorizontal: 12 },
  close: { color: colors.primary, fontWeight: '700', marginBottom: 10 },
  modalHeader: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});
