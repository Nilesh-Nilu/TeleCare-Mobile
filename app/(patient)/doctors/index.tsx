import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetDoctorsQuery } from '../../../src/store/apiSlice';
import { AppHeader, SearchBar, FilterChips, DoctorCard, EmptyState } from '../../../src/components';
import { SPECIALTIES } from '../../../src/utils/constants';
import { useDebounce } from '../../../src/hooks/useDebounce';
import { Colors } from '../../../src/theme';
import type { Doctor } from '../../../src/types';

const filters = ['All', ...SPECIALTIES];

export default function DoctorListScreen() {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, refetch } = useGetDoctorsQuery({
    search: debouncedSearch || undefined,
    specialty: specialty === 'All' ? undefined : specialty,
  });

  const doctors: Doctor[] = data?.data || [];
  console.log(doctors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Find Doctors" showBack />
      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search doctors by name or specialty..."
        />
        <FilterChips
          options={filters}
          selected={specialty}
          onSelect={setSpecialty}
        />
        {isLoading && doctors.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DoctorCard doctor={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            ListEmptyComponent={
              <EmptyState
                icon="doctor"
                title="No doctors found"
                subtitle="Try adjusting your search or filters"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  list: { paddingBottom: 24, flexGrow: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
