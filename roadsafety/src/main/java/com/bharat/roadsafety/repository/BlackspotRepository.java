package com.bharat.roadsafety.repository;

import com.bharat.roadsafety.model.Blackspot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlackspotRepository extends JpaRepository<Blackspot, Long> {
    
    Optional<Blackspot> findByLatitudeAndLongitude(Double latitude, Double longitude);
}
