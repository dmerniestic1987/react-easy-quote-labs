import {Box, Paper, TextField} from "@mui/material";
import LabSummaryTable from "../src/LabSummaryTable";

export default function Summary() {
    return (
        <Paper elevation={3} sx={{p: 12, pt: 1}} >
            <Box sx={{ p: 2 }} textAlign={'center'} >
                <h1> Cotización: Análisis de Laboratorios </h1>
                <TextField id="full-name"
                           label="Nombre completo del paciente"
                           variant="outlined"
                           required={true}
                           fullWidth
                           />
                <LabSummaryTable />
            </Box>
        </Paper>
    );
}
