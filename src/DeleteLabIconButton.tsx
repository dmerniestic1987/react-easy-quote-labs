import {LabItem} from "./services/lab-calculator";
import React from "react";
import {IconButton} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function DeleteLabIconButton({ labItem, deleteSelectedLabItem }: { labItem: LabItem, deleteSelectedLabItem: Function }) {
    return (
        <IconButton
            onClick={() => {
                deleteSelectedLabItem(labItem);
            }}
        >
            <DeleteIcon />
        </IconButton>
    )
}
