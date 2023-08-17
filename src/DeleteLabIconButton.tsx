import {LabItem} from "./services/lab-calculator";
import React from "react";
import {IconButton} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function DeleteLabIconButton(
    { labItem, deleteSelectedLabItem, deleteSelectedRowSelectionModel }: { labItem: LabItem, deleteSelectedLabItem: Function, deleteSelectedRowSelectionModel: Function }) {
    return (
        <IconButton
            onClick={() => {
                deleteSelectedLabItem(labItem);
                deleteSelectedRowSelectionModel(labItem);
            }}
        >
            <DeleteIcon />
        </IconButton>
    )
}
