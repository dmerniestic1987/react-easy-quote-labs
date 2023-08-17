import React from 'react';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { LabItem } from './services/lab-calculator';

interface DeleteLabIconButtonInputParams {
    labItem: LabItem,
    deleteSelectedLabItem: Function,
    deleteSelectedRowSelectionModel: Function
}

export default function DeleteLabIconButton(
  { labItem, deleteSelectedLabItem, deleteSelectedRowSelectionModel }: DeleteLabIconButtonInputParams,
) {
  return (
        <IconButton
            onClick={() => {
              deleteSelectedLabItem(labItem);
              deleteSelectedRowSelectionModel(labItem);
            }}
        >
            <DeleteIcon />
        </IconButton>
  );
}
