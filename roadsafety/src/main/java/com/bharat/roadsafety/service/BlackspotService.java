package com.bharat.roadsafety.service;

import com.bharat.roadsafety.model.Blackspot;
import com.bharat.roadsafety.repository.BlackspotRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@Service
public class BlackspotService {

    private final BlackspotRepository repository;

    public BlackspotService(BlackspotRepository repository) {
        this.repository = repository;
    }

    public List<Blackspot> getAllBlackspots() {
        return repository.findAll();
    }

    public Blackspot getRisk(Double lat, Double lon) {
        return repository.findByLatitudeAndLongitude(lat, lon).orElse(null);
    }

    // ✅ ADD THIS METHOD

    public Blackspot saveBlackspot(Blackspot blackspot) {
        return repository.save(blackspot);
    }
}