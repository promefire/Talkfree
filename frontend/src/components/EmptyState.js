import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
  minHeight: '200px',
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

const EmptyState = ({
  icon,
  title = '暂无数据',
  description = '没有找到相关数据',
  actionText,
  onAction,
}) => {
  return (
    <EmptyStateContainer>
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', '& svg': { fontSize: 64 } }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: actionText ? 3 : 0 }}>
        {description}
      </Typography>
      
      {actionText && onAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </EmptyStateContainer>
  );
};

export default EmptyState;