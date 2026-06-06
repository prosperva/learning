'use client';

import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { NAV_HEIGHT } from '@/lib/layout';

export default function TopNav() {
  return (
    <AppBar position="static" elevation={1} sx={{ bgcolor: '#1a2744' }}>
      <Toolbar variant="dense" sx={{ minHeight: `${NAV_HEIGHT}px` }}>
        <Typography variant="subtitle1" fontWeight={600} color="inherit">
          CommonFields
        </Typography>
        <Box sx={{ flex: 1 }} />
      </Toolbar>
    </AppBar>
  );
}
