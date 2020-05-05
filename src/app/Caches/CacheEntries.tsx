import React, { useState } from 'react';
import {
  Bullseye,
  Button,
  ButtonVariant,
  DataToolbar,
  DataToolbarContent,
  DataToolbarItem,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  InputGroup,
  StackItem,
  TextInput,
  Title
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { AddEntryForm } from '@app/Caches/AddEntryForm';
import cacheService from '../../services/cacheService';
import { Table, TableBody, TableHeader } from '@patternfly/react-table';

const CacheEntries: React.FunctionComponent<any> = (props: {
  cacheName: string;
}) => {
  const [isAddEntryFormOpen, setAddEntryFormOpen] = useState<boolean>(false);
  const [keyToSearch, setKeyToSearch] = useState<string>('');
  const onClickAddEntryButton = () => {
    setAddEntryFormOpen(true);
  };

  const [rows, setRows] = useState<any[]>([]);
  const columns = [{ title: 'Key' }, { title: 'Value' }];

  const updateRows = (entries: CacheEntry[]) => {
    let rows: { heightAuto: boolean; cells: (string | any)[] }[];

    if (entries.length == 0) {
      rows = [
        {
          heightAuto: true,
          cells: [
            {
              props: { colSpan: 2 },
              title: (
                <Bullseye>
                  <EmptyState variant={EmptyStateVariant.small}>
                    <EmptyStateIcon icon={SearchIcon} />
                    <Title headingLevel="h2" size="lg">
                      Entry with key <strong>{keyToSearch}</strong> not found.
                    </Title>
                  </EmptyState>
                </Bullseye>
              )
            }
          ]
        }
      ];
    } else {
      rows = entries.map(entry => {
        return {
          heightAuto: true,
          cells: [{ title: entry.key }, { title: entry.value }]
        };
      });
    }
    setRows(rows);
  };

  const closeAddEntryFormModal = () => {
    setAddEntryFormOpen(false);
  };

  const onChangeKeySearch = value => {
    if (value.length == 0) {
      setRows([]);
    }
    setKeyToSearch(value.trim());
  };

  const searchEntryByKey = () => {
    if(keyToSearch.length == 0) {
      return;
    }

    cacheService.getEntry(props.cacheName, keyToSearch).then(response => {
      if (response.isRight()) {
        updateRows([response.value]);
      } else {
        updateRows([]);
      }
    });
  };

  const searchEntryOnKeyPress = event => {
    if (event.key === 'Enter') {
      searchEntryByKey();
    }
  };

  return (
    <React.Fragment>
      <DataToolbar id="cache-entries-toolbar">
        <DataToolbarContent>
          <DataToolbarItem>
            <InputGroup>
              <TextInput
                name="textSearchByKey"
                id="textSearchByKey"
                type="search"
                aria-label="search by key textfield"
                placeholder={'Get by key'}
                size={50}
                onChange={onChangeKeySearch}
                onKeyPress={searchEntryOnKeyPress}
              />
              <Button
                variant="control"
                aria-label="search button for search input"
                onClick={searchEntryByKey}
              >
                <SearchIcon />
              </Button>
            </InputGroup>
          </DataToolbarItem>
          <DataToolbarItem>
            <Button
              key="add-entry-button"
              variant={ButtonVariant.primary}
              onClick={onClickAddEntryButton}
            >
              Add entry
            </Button>
            <AddEntryForm
              cacheName={props.cacheName}
              isModalOpen={isAddEntryFormOpen}
              closeModal={closeAddEntryFormModal}
            />
          </DataToolbarItem>
          <DataToolbarItem>
            <Button variant={ButtonVariant.link} isDisabled>
              Clear all entries
            </Button>
          </DataToolbarItem>
        </DataToolbarContent>
      </DataToolbar>
      <Table
        aria-label="Entries"
        cells={columns}
        rows={rows}
        className={'entries-table'}
      >
        <TableHeader />
        <TableBody />
      </Table>
    </React.Fragment>
  );
};

export { CacheEntries };
