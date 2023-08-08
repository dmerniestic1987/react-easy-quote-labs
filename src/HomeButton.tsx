import * as React from 'react';
import Button from "@mui/material/Button";
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/navigation';

export default function HomeButton() {
    const router = useRouter();
    return (
        <>
            <Button sx={{ mt: 2 }} variant="contained" endIcon={<HomeIcon />} onClick={
                () => router.push('/')
            }>
                Finalizar
            </Button>
        </>
  );
}
