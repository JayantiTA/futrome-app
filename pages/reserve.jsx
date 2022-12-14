import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LoadingButton from '@mui/lab/LoadingButton';
import { makeStyles } from '@mui/styles';

import DefaultInput from '../components/input/DefaultInput';
import { useAuthStore } from '../store/store';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'IDR',
});

const useStyles = makeStyles((theme) => ({
  button: {
    backgroundColor: theme.palette.green.main,
    color: theme.palette.white.main,
    padding: '0.5rem 1.5rem',
    textTransform: 'none',
    fontSize: 17,
    margin: '0 auto',
    '&:hover': {
      backgroundColor: theme.palette.green.hover,
    },
  },
  button2: {
    backgroundColor: '#D9D9D9',
    color: theme.palette.green.main,
    padding: '0.5rem 1.5rem',
    textTransform: 'none',
    fontSize: 17,
    margin: '0 auto',
    '&:hover': {
      backgroundColor: theme.palette.grey.light,
    },
  },
}));

export default function Reserve() {
  const classes = useStyles();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [errors, setErrors] = useState({});
  const [isAlertOpened, setIsAlertOpened] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buyerData, setBuyerData] = useState({});
  const [graveData, setGraveData] = useState({});
  const [detailGrave, setDetailGrave] = useState({});

  const getData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/graves/${router.query?.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      setGraveData(response.data.data);
      setDetailGrave({
        'Tipe:': response.data.data.type,
        'Lokasi:': response.data.data.location,
        'Kapasitas:': response.data.data.capacity,
        'Ukuran:': `${response.data.data.size} m2`,
        'Deskripsi:': response.data.data.description,
        'Harga:': formatter.format(response.data.data.price),
      });
    } catch (error) {
    // eslint-disable-next-line no-console
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const formInputs = [
    {
      component: DefaultInput,
      props: {
        label: 'Nama Lengkap',
        type: 'text',
        value: buyerData.name,
        onChange: (e) => setBuyerData({ ...buyerData, name: e.target.value }),
        error: errors?.errors ? errors?.errors['buyer_data.name'] : null,
        isLoading,
      },
    },
    {
      component: DefaultInput,
      props: {
        label: 'Nomor KTP',
        type: 'text',
        value: buyerData.ktp,
        onChange: (e) => setBuyerData({ ...buyerData, ktp: e.target.value }),
        error: errors?.errors ? errors?.errors['buyer_data.ktp'] : null,
        isLoading,
      },
    },
    {
      component: DefaultInput,
      props: {
        label: 'Nomor HP',
        type: 'text',
        value: buyerData.phone,
        onChange: (e) => setBuyerData({ ...buyerData, phone: e.target.value }),
        error: errors?.errors ? errors?.errors['buyer_data.phone_number'] : null,
        isLoading,
      },
    },
  ];

  const handleAction = (event) => {
    event.preventDefault();
    (async () => {
      try {
        setIsLoading(true);
        const body = {
          grave: {
            id: graveData._id,
            location: graveData.location,
            type: graveData.type,
            price: graveData.price,
          },
          buyer_data: {
            name: buyerData.name,
            ktp: buyerData.ktp,
            phone_number: buyerData.phone,
          },
        };
        await axios.post('/api/reservations/reserve', body, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        router.push({ pathname: '/profile', query: { success: true } });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        setErrors(error.response.data);
        setIsAlertOpened(true);
      }
      setIsLoading(false);
    })();
  };

  return (
    <Box marginY={7} minHeight="100vh">
      <Box sx={{
        borderBottom: 1, borderColor: 'divider', maxWidth: 400, mx: 'auto', display: 'flex', justifyContent: 'center',
      }}
      >
        <Snackbar
          open={isAlertOpened}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Alert
            severity="error"
            sx={{ backgroundColor: '#D23030', color: '#FFFFFF' }}
            action={(
              <IconButton
                size="small"
                aria-label="close"
                sx={{ color: '#FFFFFF' }}
                onClick={() => {
                  setIsAlertOpened(false);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          >
            {errors?.message}
          </Alert>
        </Snackbar>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#195A00', my: 1, mx: 'auto' }}>
          Data Pemesan
        </Typography>
      </Box>
      <Box component="form" noValidate onSubmit={handleAction} display="flex" flexDirection="column" maxWidth={700} marginX="auto" marginTop={3}>
        {formInputs.map((input) => (
          <input.component {...input.props} />
        ))}
        <Box border={1} borderColor="#B6BCA4" borderRadius={2} marginY={5}>
          <Typography variant="h5" margin={3}>
            Detail Kuburan
          </Typography>
          <Box sx={{
            display: 'flex', alignItems: 'center', paddingX: 12,
          }}
          >
            {isLoading ? (
              <CircularProgress sx={{ color: '#195A00' }} />
            ) : (
              <Table>
                <TableBody>
                  {detailGrave && Object.keys(detailGrave).map((key) => (
                    <TableRow key={key}>
                      <TableCell>
                        <Typography variant="body1" sx={{ color: '#195A00' }}>
                          {key}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={600} sx={{ color: '#195A00' }}>
                          {detailGrave[key]}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
          <Box marginY={3} marginLeft="50%">
            <Typography variant="body1">
              Total Tagihan
            </Typography>
            <Typography variant="h4" sx={{ color: '#195A00' }}>
              {formatter.format(graveData.price)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Button variant="contained" className={classes.button2} href="/payment_method">
            Jenis Pembayaran
          </Button>
          <LoadingButton
            variant="contained"
            type="submit"
            className={classes.button}
            loading={isLoading}
            disabled={isLoading}
          >
            Bayar
          </LoadingButton>
        </Box>
      </Box>
    </Box>
  );
}
