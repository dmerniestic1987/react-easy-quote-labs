import {Box, Paper, TextField,Container} from "@mui/material";
import LabSummaryTable from "../src/LabSummaryTable";
import HomeButton from "../src/HomeButton";

export default function Summary() {
    return (
        <Container maxWidth="lg">
            <Box sx={{ pr: 20, pb: 2, pt: 2, px: 20 }} textAlign={'center'} >
                <h1> Cotización: Análisis de Laboratorios </h1>
                <TextField id="full-name"
                           label="Nombre completo del paciente"
                           variant="outlined"
                           required={true}
                           fullWidth
                />
                <LabSummaryTable />
                <HomeButton />
            </Box>
        </Container>

    );
}
