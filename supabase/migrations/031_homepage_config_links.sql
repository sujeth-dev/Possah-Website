-- Migration 031: update homepage_config occasion_tiles links from /shop/ to /women/
UPDATE homepage_config
SET occasion_tiles = (
  SELECT jsonb_agg(
    tile || jsonb_build_object('link', replace(tile->>'link', '/shop/', '/women/'))
  )
  FROM jsonb_array_elements(occasion_tiles) AS tile
);
