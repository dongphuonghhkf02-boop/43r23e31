/**
 * useCarBySlugOrId — fetch admin-curated car detail from /api/public/cars/{slug_or_id}.
 *
 * Returns:
 *   { loading, error, car, similar }
 *
 *   car      — full curated record from the cars collection
 *   similar  — up to 4 cars from the same budget_bucket (no self)
 */
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function useCarBySlugOrId(slugOrId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [car, setCar] = useState(null);
  const [similar, setSimilar] = useState([]);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!slugOrId) {
      setLoading(false);
      setError("missing_slug");
      setCar(null);
      setSimilar([]);
      return;
    }
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/api/public/cars/${encodeURIComponent(slugOrId)}`,
          { timeout: 12000 },
        );
        if (reqIdRef.current !== reqId) return;
        setCar(data?.car || null);
        setSimilar(Array.isArray(data?.similar) ? data.similar : []);
        setLoading(false);
      } catch (e) {
        if (reqIdRef.current !== reqId) return;
        const status = e?.response?.status;
        if (status === 404) setError("not_found");
        else setError(e?.response?.data?.detail || e?.message || "error");
        setCar(null);
        setSimilar([]);
        setLoading(false);
      }
    })();
  }, [slugOrId]);

  return useMemo(
    () => ({ loading, error, car, similar }),
    [loading, error, car, similar],
  );
}
