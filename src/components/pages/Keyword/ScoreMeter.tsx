'use client';

import React from 'react';
import {
  Box,
  Text,
  Flex,
  Button
} from '@chakra-ui/react';

type ScoreMeterProps = {
  score?: number | null;
  colorMode: string;
};

const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  colorMode
}) => {
  const radius = 75;
  const stroke = 6; // ✅ Thin stroke width
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const safeScore = typeof score === 'number' ? score : 0;
  const percent = Math.min(Math.max(safeScore / 100, 0), 1);
  const strokeDashoffset = circumference * (1 - percent);

  return (
    <Box p={6} rounded="xl" boxShadow="md" w="100%" bg={colorMode === 'dark' ? '#151922' : '#fff'}>
      {/* Header */}
      <Flex justify="center" align="center" mb={3}>
       <Text fontWeight="bold" fontSize="lg" className="text-slate-500 text-center">
        Word Count
       </Text>
      </Flex>

      {/* Meter */}
      <Box position="relative" w="100%" h="160px">
        <svg width="100%" height="160" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={normalizedRadius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          {/* Foreground circle */}
          <circle
            cx="80"
            cy="80"
            r={normalizedRadius}
            fill="transparent"
            stroke="url(#gradient)"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f56565" />
              <stop offset="50%" stopColor="#ecc94b" />
              <stop offset="100%" stopColor="#48bb78" />
            </linearGradient>
          </defs>
        </svg>

        {/* Score Text */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
        >
          <Text fontSize="3xl" fontWeight="bold" lineHeight="1" className='text-slate-500'>
            {score ? score : 'NA'}
            <Text as="span" fontSize="md" color="gray.500"></Text>
          </Text>
          <Text fontSize="xs" color="gray.500">Words</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default ScoreMeter;
